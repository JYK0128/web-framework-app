import { type DynamicModule, Module, type Type } from '@nestjs/common';

import { LocalStorageAdapter } from './adapters/local/local-storage.adapter';
import { LocalUploadController } from './adapters/local/local-upload.controller';
import { S3StorageAdapter } from './adapters/s3/s3-storage.adapter';
import { type IStorageAdapter, STORAGE_ADAPTER, STORAGE_MODULE_OPTIONS, type StorageModuleOptions } from './storage.interface';
import { StorageService } from './storage.service';

@Module({})
export class StorageModule {
  static forRoot(options?: StorageModuleOptions): DynamicModule {
    const driver = options?.driver ?? (options?.s3 ? 's3' : 'local');
    const selectedAdapter: Type<IStorageAdapter> = driver === 's3'
      ? S3StorageAdapter
      : LocalStorageAdapter;

    return {
      module: StorageModule,
      global: true,
      controllers: driver === 'local' ? [LocalUploadController] : [],
      providers: [
        {
          provide: STORAGE_MODULE_OPTIONS,
          useValue: options ?? {},
        },
        selectedAdapter,
        {
          provide: STORAGE_ADAPTER,
          useExisting: selectedAdapter,
        },
        StorageService,
      ],
      exports: [StorageService],
    };
  }
}
