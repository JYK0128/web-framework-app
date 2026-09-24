import { BadRequestException, Controller, HttpCode, HttpStatus, Param, Put, Req } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request } from 'express';

import { Public } from '#/common/decorators/auth-mode.decorator';

import { LocalStorageAdapter } from './local-storage.adapter';

@ApiExcludeController()
@Controller()
export class LocalUploadController {
  constructor(private readonly localAdapter: LocalStorageAdapter) {}

  @Public()
  @Put('uploads/:subDir/:filename')
  @HttpCode(HttpStatus.OK)
  async uploadBinary(@Param('subDir') subDir: string, @Param('filename') filename: string, @Req() req: Request): Promise<{ ok: true }> {
    const cleanSubDir = subDir.replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, '');
    if (!cleanSubDir || !cleanFilename) throw new BadRequestException('유효하지 않은 파일 경로 또는 파일명입니다.');

    const body: unknown = req.body;
    const rawBody: unknown = (req as unknown as { rawBody?: unknown }).rawBody;
    let buffer: Buffer;
    if (Buffer.isBuffer(body)) {
      buffer = body;
    }
    else if (Buffer.isBuffer(rawBody)) {
      buffer = rawBody;
    }
    else {
      buffer = Buffer.from(typeof body === 'string' ? body : JSON.stringify(body ?? ''));
    }
    if (buffer.length > 2 * 1024 * 1024) throw new BadRequestException('파일 크기는 2MB를 초과할 수 없습니다.');

    await this.localAdapter.saveFile(cleanSubDir, cleanFilename, buffer);
    return { ok: true };
  }
}
