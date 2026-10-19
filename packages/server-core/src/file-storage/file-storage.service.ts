import { HttpStatus } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

import type { FileStorageAdapter } from './file-storage.interface';

export class FileStorageService {
  constructor(private readonly adapters: ReadonlyMap<string, FileStorageAdapter>) {}

  has(name: string): boolean {
    return this.adapters.has(name);
  }

  use(name: string): FileStorageAdapter {
    const adapter = this.adapters.get(name);
    if (!adapter) throw new ApplicationError({ code: 'INTERNAL_SERVER_ERROR', status: HttpStatus.INTERNAL_SERVER_ERROR });
    return adapter;
  }
}

export { FileStorageService as StorageService };
