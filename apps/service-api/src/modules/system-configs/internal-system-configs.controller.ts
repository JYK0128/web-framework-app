import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Put, Req, Res } from '@nestjs/common';
import { ApiExcludeController, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { MachineAuth } from '#/common/decorators/auth-mode.decorator';

import { CreateOAuthIconPresignedUrlRequestDto } from './oauth-icon.dto';
import { SystemConfigService } from './system-config.service';

@ApiTags('Internal (Machine)')
@ApiExcludeController()
@MachineAuth()
@Controller('internal/system-configs')
export class InternalSystemConfigsController {
  constructor(private readonly service: SystemConfigService) {}

  @Get()
  getConfigs(): Promise<Record<string, unknown>> {
    return this.service.getResponse();
  }

  @Patch()
  update(@Body() input: unknown): Promise<string[]> {
    return this.service.update(input);
  }

  @Post('sync')
  async sync(): Promise<{ ok: true, message: string }> {
    await this.service.syncToRedis();
    return { ok: true, message: '서비스 설정을 Redis에 동기화했습니다.' };
  }

  @Post('oauth-icons/presigned-url')
  createOAuthIconPresignedUrl(@Body() input: CreateOAuthIconPresignedUrlRequestDto) {
    return this.service.createOAuthIconPresignedUrl(input);
  }

  @Put('oauth-icons/:filename')
  async uploadOAuthIcon(@Param('filename') filename: string, @Req() request: Request): Promise<{ ok: true }> {
    const cleanFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, '');
    if (!cleanFilename || cleanFilename !== filename) throw new BadRequestException('유효하지 않은 파일명입니다.');
    const body: unknown = request.body;
    if (!Buffer.isBuffer(body)) throw new BadRequestException('파일 데이터를 읽을 수 없습니다.');
    await this.service.uploadOAuthIcon(cleanFilename, request.headers['content-type'] ?? 'application/octet-stream', body);
    return { ok: true };
  }

  @Get('oauth-icons/:filename')
  async getOAuthIcon(@Param('filename') filename: string, @Res() response: Response): Promise<void> {
    const cleanFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, '');
    if (!cleanFilename || cleanFilename !== filename) throw new BadRequestException('유효하지 않은 파일명입니다.');
    const file = await this.service.getOAuthIcon(cleanFilename);
    response.setHeader('Content-Type', file.contentType);
    response.setHeader('Cache-Control', 'public, max-age=86400');
    response.send(file.buffer);
  }
}
