import http from 'node:http';

import { RequestContext } from '@mikro-orm/core';
import { Inject, Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ApplicationError } from '@pkg/shared/common';
import { createAdapter } from '@socket.io/redis-adapter';
import type { Request, Response } from 'express';
import { createClient } from 'redis';
import { Server, type ServerOptions } from 'socket.io';

import { ExpressSessionMiddleware } from '#/common/middlewares/express-session.middleware';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { REALTIME_MODULE_OPTIONS, type RealtimeModuleOptions, type SocketClientPolicy, type SocketTarget } from '#/infra/realtime/realtime.interface';

type SocketIoNext = (error?: Error) => void;

interface RealtimeSocket<TData> {
  data: TData
  disconnect(close?: boolean): void
  emit(event: string, payload: unknown): void
}

interface RealtimeNamespace {
  fetchSockets(): Promise<RealtimeSocket<unknown>[]>
  in(room: string): RealtimeNamespace
}

function isRealtimeNamespace(value: unknown): value is RealtimeNamespace {
  return (
    typeof value === 'object'
    && value !== null
    && typeof (value as RealtimeNamespace).fetchSockets === 'function'
    && typeof (value as RealtimeNamespace).in === 'function'
  );
}

@Injectable()
export class SocketIoAdapter extends IoAdapter implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SocketIoAdapter.name);
  private adapterConstructor: ReturnType<typeof createAdapter> | null = null;
  private pubClient: ReturnType<typeof createClient> | null = null;
  private subClient: ReturnType<typeof createClient> | null = null;
  private readonly namespaces = new Map<string, RealtimeNamespace>();

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly sessionMiddleware: ExpressSessionMiddleware,
    private readonly em: AppEntityManager,
    @Inject(REALTIME_MODULE_OPTIONS)
    private readonly options: RealtimeModuleOptions,
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    if (!this.options.socketIo?.redis) {
      this.logger.log('Redis options not configured. Using default in-memory Socket.IO adapter.');
      return;
    }

    try {
      const pubClient = createClient(this.options.socketIo.redis);
      const subClient = pubClient.duplicate();

      pubClient.on('error', (error) => {
        this.logger.error(`[Socket.IO] Redis publisher error: ${error instanceof Error ? error.message : String(error)}`);
      });
      subClient.on('error', (error) => {
        this.logger.error(`[Socket.IO] Redis subscriber error: ${error instanceof Error ? error.message : String(error)}`);
      });

      await Promise.all([
        pubClient.connect(),
        subClient.connect(),
      ]);

      this.pubClient = pubClient;
      this.subClient = subClient;
      this.adapterConstructor = createAdapter(pubClient, subClient);
      this.logger.log('Socket.IO Redis adapter connected successfully.');
    }
    catch (error) {
      this.logger.error(`Failed to initialize Socket.IO Redis adapter: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.namespaces.clear();
    if (this.pubClient?.isOpen) {
      await this.pubClient.quit();
    }
    if (this.subClient?.isOpen) {
      await this.subClient.quit();
    }
  }

  registerNamespace(namespace: string, server: unknown): void {
    if (this.namespaces.has(namespace)) {
      this.logger.warn(`Namespace "${namespace}" is already registered. Skipping.`);
      return;
    }
    if (!isRealtimeNamespace(server)) {
      this.logger.error(`registerNamespace: invalid server object for namespace "${namespace}". Skipping.`);
      return;
    }
    this.namespaces.set(namespace, server);
  }

  async emit<TData>(
    target: SocketTarget,
    event: string,
    payload: unknown,
    policy?: SocketClientPolicy<TData>,
  ): Promise<number> {
    const sockets = await this.getSockets<TData>(target);
    let recipientCount = 0;

    for (const socket of sockets) {
      if (policy?.filter && !policy.filter(socket.data)) continue;
      if (policy?.isActive && !(await policy.isActive(socket.data))) continue;

      socket.emit(event, payload);
      recipientCount += 1;
    }

    return recipientCount;
  }

  async hasConnection<TData>(target: SocketTarget, policy?: SocketClientPolicy<TData>): Promise<boolean> {
    const sockets = await this.getSockets<TData>(target);

    for (const socket of sockets) {
      if (policy?.filter && !policy.filter(socket.data)) continue;
      if (policy?.isActive && !(await policy.isActive(socket.data))) continue;
      return true;
    }

    return false;
  }

  override createIOServer(_port: number, options?: ServerOptions): Server {
    const httpServer = this.httpAdapterHost.httpAdapter.getHttpServer() as http.Server;
    const server = new Server(httpServer, options);

    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }

    server.engine.use((request, response, next) => {
      this.initializeSocketRequest(request as Request, response as Response, next as SocketIoNext);
    });

    return server;
  }

  private initializeSocketRequest(request: Request, response: Response, next: SocketIoNext): void {
    void RequestContext.create(
      this.em,
      () => this.runSessionMiddleware(request, response),
    ).then(
      () => next(),
      (error: unknown) => next(ApplicationError.from(error, 'SOCKET_SESSION_MIDDLEWARE_FAILED')),
    );
  }

  private async runSessionMiddleware(request: Request, response: Response): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.sessionMiddleware.useWebSocket(request, response, (error?: unknown) => {
        if (!error) {
          resolve();
          return;
        }
        reject(ApplicationError.from(error, 'SOCKET_SESSION_MIDDLEWARE_FAILED'));
      });
    });
  }

  private async getSockets<TData>(target: SocketTarget): Promise<RealtimeSocket<TData>[]> {
    const namespace = this.namespaces.get(target.namespace);
    if (!namespace) return [];

    const targetNamespace = target.room ? namespace.in(target.room) : namespace;
    return await targetNamespace.fetchSockets() as RealtimeSocket<TData>[];
  }
}
