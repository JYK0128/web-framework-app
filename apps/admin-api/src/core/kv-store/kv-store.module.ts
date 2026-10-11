import { type DynamicModule, Module, type Type } from '@nestjs/common';

import { InMemoryAdapter } from './adapters/in-memory.adapter';
import { RedisAdapter } from './adapters/redis.adapter';
import { KV_ADAPTER, KV_STORE_MODULE_OPTIONS, type KvAdapter, type KvStoreModuleOptions } from './kv-store.interface';
import { KvStore } from './kv-store.service';

@Module({})
export class KvStoreModule {
  static forRoot(options?: KvStoreModuleOptions): DynamicModule {
    const driver = options?.driver ?? (options?.redis ? 'redis' : 'in-memory');
    const selectedAdapter: Type<KvAdapter> = driver === 'redis'
      ? RedisAdapter
      : InMemoryAdapter;

    return {
      module: KvStoreModule,
      global: true,
      providers: [
        {
          provide: KV_STORE_MODULE_OPTIONS,
          useValue: options ?? {},
        },
        selectedAdapter,
        {
          provide: KV_ADAPTER,
          useExisting: selectedAdapter,
        },
        KvStore,
      ],
      exports: [KvStore],
    };
  }
}
