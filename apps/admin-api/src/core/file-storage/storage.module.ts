import { type DynamicModule, Module, type Type } from '@nestjs/common';

import { LocalStorageAdapter } from '#/core/file-storage/adapters/local-storage.adapter';
import { S3StorageAdapter } from '#/core/file-storage/adapters/s3-storage.adapter';
import { type IStorageAdapter, STORAGE_ADAPTER, STORAGE_MODULE_OPTIONS, type StorageModuleOptions } from '#/core/file-storage/storage.interface';
import { StorageService } from '#/core/file-storage/storage.service';

@Module({})
export class StorageModule {
  static forRoot(options?: StorageModuleOptions): DynamicModule {
    const driver = options?.driver ?? 'local';
    const selectedAdapter: Type<IStorageAdapter> = driver === 's3' ? S3StorageAdapter : LocalStorageAdapter;

    return {
      module: StorageModule,
      global: true,
      providers: [
        { provide: STORAGE_MODULE_OPTIONS, useValue: options ?? {} },
        selectedAdapter,
        { provide: STORAGE_ADAPTER, useExisting: selectedAdapter },
        { provide: StorageService, useExisting: selectedAdapter },
      ],
      exports: [StorageService],
    };
  }
}
