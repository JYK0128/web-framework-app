import { RequestContext } from '@mikro-orm/core';
import { Inject, Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ApplicationError } from '@pkg/shared/common';
import { createAdapter } from '@socket.io/redis-adapter';
import type { Request, Response } from 'express';
import { createClient } from 'redis';
import type { Server, ServerOptions } from 'socket.io';

import { ExpressSessionMiddleware } from '#/common/middlewares/express-session.middleware';
import { AppEntityManager } from '#/infra/database/entity-manager';

import { SOCKET_IO_MODULE_OPTIONS, type SocketIoModuleOptions } from './socket-io.interface';

type EngineNext = (error?: Error) => void;

@Injectable()
export class SocketIoAdapter extends IoAdapter implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SocketIoAdapter.name);
  private adapterConstructor: ReturnType<typeof createAdapter> | null = null;
  private pubClient: ReturnType<typeof createClient> | null = null;
  private subClient: ReturnType<typeof createClient> | null = null;

  constructor(
    private readonly sessionMiddleware: ExpressSessionMiddleware,
    private readonly em: AppEntityManager,
    @Inject(SOCKET_IO_MODULE_OPTIONS)
    private readonly options: SocketIoModuleOptions,
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    if (!this.options?.redis) {
      this.logger.log('Redis options not configured. Using default in-memory Socket.IO adapter.');
      return;
    }

    try {
      const pubClient = createClient(this.options.redis);
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
    if (this.pubClient?.isOpen) {
      await this.pubClient.quit();
    }
    if (this.subClient?.isOpen) {
      await this.subClient.quit();
    }
  }

  override createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(port, options) as Server;

    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }

    server.engine.use((request, response, next) => {
      this.initializeSocketRequest(request as Request, response as Response, next as EngineNext);
    });

    return server;
  }

  private initializeSocketRequest(request: Request, response: Response, next: EngineNext): void {
    void RequestContext.create(
      this.em,
      () => this.runSessionMiddleware(request, response),
    ).then(
      () => next(),
      (error: unknown) => next(ApplicationError.toError(error, 'Socket.IO session middleware failed')),
    );
  }

  private async runSessionMiddleware(request: Request, response: Response): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.sessionMiddleware.useWebSocket(request, response, (error?: unknown) => {
        if (!error) {
          resolve();
          return;
        }
        reject(ApplicationError.toError(error, 'Socket.IO session middleware failed'));
      });
    });
  }
}
