import { type DynamicModule, Module, type Type } from '@nestjs/common';

import { LocalAdapter } from '#/core/file-storage/adapters/local.adapter';
import { S3Adapter } from '#/core/file-storage/adapters/s3.adapter';
import { FILE_STORAGE_ADAPTER, FILE_STORAGE_MODULE_OPTIONS, type FileStorageAdapter, type FileStorageModuleOptions } from '#/core/file-storage/file-storage.interface';
import { FileStorageService } from '#/core/file-storage/file-storage.service';

@Module({})
export class FileStorageModule {
  static forRoot(options?: FileStorageModuleOptions): DynamicModule {
    const driver = options?.driver ?? 'local';
    const selectedAdapter: Type<FileStorageAdapter> = driver === 's3' ? S3Adapter : LocalAdapter;

    return {
      module: FileStorageModule,
      global: true,
      providers: [
        { provide: FILE_STORAGE_MODULE_OPTIONS, useValue: options ?? {} },
        selectedAdapter,
        { provide: FILE_STORAGE_ADAPTER, useExisting: selectedAdapter },
        { provide: FileStorageService, useExisting: selectedAdapter },
      ],
      exports: [FileStorageService],
    };
  }
}
