import { type DynamicModule, Module, type Type } from '@nestjs/common';

import { InMemoryKvStoreAdapter } from './adapters/in-memory/in-memory-kv-store.adapter';
import { RedisKvStoreAdapter } from './adapters/redis/redis-kv-store.adapter';
import { type IKvStoreAdapter, KV_STORE_ADAPTER, KV_STORE_MODULE_OPTIONS, type KvStoreModuleOptions } from './kv-store.interface';
import { KvStore } from './kv-store.service';

@Module({})
export class KvStoreModule {
  static forRoot(options?: KvStoreModuleOptions): DynamicModule {
    const driver = options?.driver ?? (options?.redis ? 'redis' : 'in-memory');
    const selectedAdapter: Type<IKvStoreAdapter> = driver === 'redis'
      ? RedisKvStoreAdapter
      : InMemoryKvStoreAdapter;

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
          provide: KV_STORE_ADAPTER,
          useExisting: selectedAdapter,
        },
        KvStore,
      ],
      exports: [KvStore],
    };
  }
}
