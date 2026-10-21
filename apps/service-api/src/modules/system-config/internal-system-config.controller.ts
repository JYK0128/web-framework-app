import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Put, Req, Res } from '@nestjs/common';
import { ApiExcludeController, ApiTags } from '@nestjs/swagger';
import { MachineAuth, NoStore } from '@pkg/server-core/http/decorators';
import { instanceToPlain } from 'class-transformer';
import type { Request, Response } from 'express';

import { SERVICE_RUNTIME_CONFIG } from '~/app.config';
import { NotificationTestConfigRequestDto } from '~/modules/system-config/notification/notification-test-config.request.dto';
import { CreateOAuthIconPresignedUrlRequestDto } from '~/modules/system-config/oauth/create-oauth-icon-presigned-url.request.dto';
import { SystemConfigService } from '~/modules/system-config/system-config.service';
import { UpdateInternalSystemConfigsRequestDto } from '~/modules/system-config/update-internal-system-configs.request.dto';

@ApiTags('Internal (Machine)')
@ApiExcludeController()
@MachineAuth()
@Controller('internal/system-config')
export class InternalSystemConfigController {
  constructor(private readonly service: SystemConfigService) {}

  @Get()
  getConfigs(): Promise<Record<string, unknown>> {
    return this.service.getResponse();
  }

  @Patch()
  update(@Body() input: UpdateInternalSystemConfigsRequestDto): Promise<string[]> {
    return this.service.update(instanceToPlain(input));
  }

  @Post('notification/config-for-test')
  @NoStore()
  getNotificationConfigForTest(@Body() input: NotificationTestConfigRequestDto) {
    return this.service.getNotificationConfigForTest(input);
  }

  @Post('sync')
  async sync(): Promise<{ ok: true }> {
    await this.service.syncToRedis();
    return { ok: true };
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
    response.setHeader('Cache-Control', `public, max-age=${SERVICE_RUNTIME_CONFIG.staticAssetsCacheMaxAgeSeconds}`);
    response.send(file.buffer);
  }
}
