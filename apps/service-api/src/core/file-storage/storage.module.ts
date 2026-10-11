import { type DynamicModule, Module, type Type } from '@nestjs/common';

import { LocalAdapter } from '#/core/file-storage/adapters/local.adapter';
import { S3Adapter } from '#/core/file-storage/adapters/s3.adapter';
import { type FileAdapter, FILE_ADAPTER, STORAGE_MODULE_OPTIONS, type StorageModuleOptions } from '#/core/file-storage/storage.interface';
import { StorageService } from '#/core/file-storage/storage.service';

@Module({})
export class StorageModule {
  static forRoot(options?: StorageModuleOptions): DynamicModule {
    const driver = options?.driver ?? 'local';
    const selectedAdapter: Type<FileAdapter> = driver === 's3' ? S3Adapter : LocalAdapter;

    return {
      module: StorageModule,
      global: true,
      providers: [
        { provide: STORAGE_MODULE_OPTIONS, useValue: options ?? {} },
        selectedAdapter,
        { provide: FILE_ADAPTER, useExisting: selectedAdapter },
        { provide: StorageService, useExisting: selectedAdapter },
      ],
      exports: [StorageService],
    };
  }
}
