import { RequestContext } from '@mikro-orm/core';
import type { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import type { Request, Response } from 'express';
import { createClient, type RedisClientType } from 'redis';
import type { Server, ServerOptions } from 'socket.io';

import { toError } from '#/common/helpers/error.helper';
import { ExpressSessionMiddleware } from '#/common/middlewares/express-session.middleware';
import { AppEntityManager } from '#/database/entity-manager';
import { env } from '#/env';

type EngineNext = (error?: Error) => void;

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter> | null = null;
  private pubClient!: RedisClientType;
  private subClient!: RedisClientType;

  constructor(
    app: INestApplicationContext,
    private readonly sessionMiddleware: ExpressSessionMiddleware,
    private readonly em: AppEntityManager,
  ) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    this.pubClient = createClient({ url: env.REDIS_URL });
    this.subClient = this.pubClient.duplicate();

    this.pubClient.on('error', (error) => {
      console.error('[socket.io] Redis publisher error', error);
    });
    this.subClient.on('error', (error) => {
      console.error('[socket.io] Redis subscriber error', error);
    });

    await Promise.all([
      this.pubClient.connect(),
      this.subClient.connect(),
    ]);
    this.adapterConstructor = createAdapter(this.pubClient, this.subClient);
  }

  override createIOServer(port: number, options?: ServerOptions) {
    if (!this.adapterConstructor) {
      throw new Error('Socket.IO Redis adapter is not connected');
    }

    const server = super.createIOServer(port, options) as Server;
    server.adapter(this.adapterConstructor);
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
      (error: unknown) => next(toError(error, 'Socket.IO session middleware failed')),
    );
  }

  private async runSessionMiddleware(request: Request, response: Response): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.sessionMiddleware.useWebSocket(request, response, (error?: unknown) => {
        if (!error) {
          resolve();
          return;
        }
        reject(toError(error, 'Socket.IO session middleware failed'));
      });
    });
  }
}
