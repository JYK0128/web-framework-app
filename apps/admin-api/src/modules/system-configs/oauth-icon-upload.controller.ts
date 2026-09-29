import { BadRequestException, Controller, Get, HttpCode, HttpStatus, Param, Put, Req, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { ADMIN_RUNTIME_CONFIG, SECURITY_CONFIG } from '#/app.config';
import { Public } from '#/common/decorators/auth-mode.decorator';
import { InternalServiceClient } from '#/infra/auth/machine/internal-service-client.service';

@ApiExcludeController()
@Controller('uploads/oauth-icons')
export class OAuthIconUploadController {
  constructor(private readonly internalClient: InternalServiceClient) {}

  @Public()
  @Put(':filename')
  @HttpCode(HttpStatus.OK)
  async upload(@Param('filename') filename: string, @Req() request: Request): Promise<{ ok: true }> {
    const cleanFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, '');
    if (!cleanFilename || cleanFilename !== filename) throw new BadRequestException('유효하지 않은 파일명입니다.');
    const body: unknown = request.body;
    if (!Buffer.isBuffer(body) || body.length < 1 || body.length > SECURITY_CONFIG.integrations.oauthIconMaxSizeBytes) {
      throw new BadRequestException(`OAuth 아이콘 파일 크기는 1바이트 이상 ${SECURITY_CONFIG.integrations.oauthIconMaxSizeBytes}바이트 이하여야 합니다.`);
    }
    const contentType = typeof request.headers['content-type'] === 'string' ? request.headers['content-type'] : 'application/octet-stream';
    await this.internalClient.upload(`/internal/system-configs/oauth-icons/${cleanFilename}`, body, contentType);
    return { ok: true };
  }

  @Public()
  @Get(':filename')
  async get(@Param('filename') filename: string, @Res() response: Response): Promise<void> {
    const cleanFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, '');
    if (!cleanFilename || cleanFilename !== filename) throw new BadRequestException('유효하지 않은 파일명입니다.');
    const file = await this.internalClient.download(`/internal/system-configs/oauth-icons/${cleanFilename}`);
    response.setHeader('Content-Type', file.contentType);
    response.setHeader('Cache-Control', `public, max-age=${ADMIN_RUNTIME_CONFIG.oauthIconCacheMaxAgeSeconds}`);
    response.send(file.body);
  }
}
