import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient, type RedisClientType } from 'redis';
import type { Server, ServerOptions } from 'socket.io';

import { env } from '#/env';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter> | null = null;
  private pubClient!: RedisClientType;
  private subClient!: RedisClientType;

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
    return server;
  }
}
