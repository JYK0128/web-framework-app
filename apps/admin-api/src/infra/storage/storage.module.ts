import { type DynamicModule, Module } from '@nestjs/common';

import { LocalStorageAdapter } from './local-storage.adapter';
import { STORAGE_ADAPTER, STORAGE_MODULE_OPTIONS, type StorageModuleOptions } from './storage.interface';
import { StorageService } from './storage.service';

@Module({})
export class StorageModule {
  static forRoot(options?: StorageModuleOptions): DynamicModule {
    return {
      module: StorageModule,
      global: true,
      providers: [
        { provide: STORAGE_MODULE_OPTIONS, useValue: options ?? {} },
        LocalStorageAdapter,
        { provide: STORAGE_ADAPTER, useExisting: LocalStorageAdapter },
        StorageService,
      ],
      exports: [StorageService],
    };
  }
}
