import { BadRequestException, Controller, HttpCode, HttpStatus, Param, Put, Req } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request } from 'express';

import { Public } from '#/common/decorators/public.decorator';

import { LocalStorageAdapter } from './local-storage.adapter';

@ApiExcludeController()
@Controller()
export class LocalUploadController {
  constructor(private readonly localAdapter: LocalStorageAdapter) {}

  @Public()
  @Put('uploads/:subDir/:filename')
  @HttpCode(HttpStatus.OK)

  async uploadBinary(
    @Param('subDir') subDir: string,
    @Param('filename') filename: string,
    @Req() req: Request,
  ): Promise<{ ok: true }> {
    const cleanSubDir = subDir.replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, '');

    if (!cleanSubDir || !cleanFilename) {
      throw new BadRequestException('유효하지 않은 파일 경로 또는 파일명입니다.');
    }

    let buffer: Buffer;
    if (Buffer.isBuffer(req.body)) {
      buffer = req.body;
    }
    else if (Buffer.isBuffer((req as unknown as { rawBody?: Buffer }).rawBody)) {
      buffer = (req as unknown as { rawBody: Buffer }).rawBody;
    }
    else if (typeof req.body === 'string') {
      buffer = Buffer.from(req.body);
    }
    else {
      buffer = Buffer.from(JSON.stringify(req.body ?? ''));
    }

    await this.localAdapter.saveFile(cleanSubDir, cleanFilename, buffer);

    return { ok: true };
  }
}
