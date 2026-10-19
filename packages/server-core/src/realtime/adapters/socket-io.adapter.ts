import http from 'node:http';

import { Inject, Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { Server, type ServerOptions } from 'socket.io';

import { REALTIME_MODULE_OPTIONS, type RealtimeModuleOptions, type SocketClientPolicy, type SocketTarget } from '#realtime/realtime.interface';

interface RealtimeSocket<TData> {
  data: TData
  disconnect(close?: boolean): void
  emit(event: string, payload: unknown): void
}

interface RealtimeNamespace {
  fetchSockets(): Promise<RealtimeSocket<unknown>[]>
  in(room: string): RealtimeNamespace
  emit(event: string, payload: unknown): void
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
    @Inject(REALTIME_MODULE_OPTIONS)
    private readonly options: RealtimeModuleOptions,
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    if (!this.options.socketIo?.redis) {
      return;
    }

    const { key, ...redisOptions } = this.options.socketIo.redis;
    const pubClient = createClient(redisOptions);
    const subClient = pubClient.duplicate();

    pubClient.on('error', (error) => {
      this.logger.error(`[Socket.IO] Redis publisher error: ${error instanceof Error ? error.message : String(error)}`);
    });
    subClient.on('error', (error) => {
      this.logger.error(`[Socket.IO] Redis subscriber error: ${error instanceof Error ? error.message : String(error)}`);
    });

    try {
      await Promise.all([
        pubClient.connect(),
        subClient.connect(),
      ]);
    }
    catch (error) {
      const cleanup = await Promise.allSettled([
        pubClient.isOpen ? pubClient.quit() : Promise.resolve(),
        subClient.isOpen ? subClient.quit() : Promise.resolve(),
      ]);
      for (const result of cleanup) {
        if (result.status === 'rejected') {
          this.logger.error(`Failed to clean up Socket.IO Redis connection: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`);
        }
      }
      throw error;
    }

    this.pubClient = pubClient;
    this.subClient = subClient;
    this.adapterConstructor = createAdapter(pubClient, subClient, { key });
    this.logger.log('Socket.IO Redis adapter connected successfully.');
  }

  async onModuleDestroy(): Promise<void> {
    this.namespaces.clear();
    if (this.pubClient?.isOpen) {
      await this.pubClient.quit();
    }
    if (this.subClient?.isOpen) {
      await this.subClient.quit();
    }
    this.logger.log('Socket.IO Redis adapter disconnected gracefully.');
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
  ): Promise<void> {
    if (!policy?.filter && !policy?.isActive) {
      const namespace = this.namespaces.get(target.namespace);
      if (!namespace) return;
      const targetNamespace = target.room ? namespace.in(target.room) : namespace;
      targetNamespace.emit(event, payload);
      return;
    }

    const sockets = await this.getSockets<TData>(target);

    for (const socket of sockets) {
      if (policy?.filter && !policy.filter(socket.data)) continue;
      if (policy?.isActive && !(await policy.isActive(socket.data))) continue;

      socket.emit(event, payload);
    }
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

    return server;
  }

  private async getSockets<TData>(target: SocketTarget): Promise<RealtimeSocket<TData>[]> {
    const namespace = this.namespaces.get(target.namespace);
    if (!namespace) return [];

    const targetNamespace = target.room ? namespace.in(target.room) : namespace;
    return await targetNamespace.fetchSockets() as RealtimeSocket<TData>[];
  }
}
