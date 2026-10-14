import { type DynamicModule, Module } from '@nestjs/common';
import type { FileStorageAdapter, FileStorageModuleOptions } from '@pkg/server-core/file-storage/file-storage.interface';
import { FileStorageService } from '@pkg/server-core/file-storage/file-storage.service';

@Module({})
export class FileStorageModule {
  static forRoot(adapters: FileStorageModuleOptions): DynamicModule {
    const adapterTypes = [...new Set(Object.values(adapters))];
    const adapterNames = Object.keys(adapters);

    return {
      module: FileStorageModule,
      global: true,
      providers: [
        ...adapterTypes,
        {
          provide: FileStorageService,
          useFactory: (...instances: FileStorageAdapter[]) => new FileStorageService(
            new Map(adapterNames.map((name, index) => [name, instances[index]])),
          ),
          inject: adapterTypes,
        },
      ],
      exports: [FileStorageService],
    };
  }
}

export { FileStorageModule as StorageModule };
