import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put, Req, Res } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminPermission } from '@pkg/shared';
import type { Request, Response } from 'express';

import { ADMIN_RUNTIME_CONFIG, SECURITY_CONFIG } from '#/app.config';
import { Public, UserAuth } from '#/core/http/decorators/auth-mode.decorator';
import { Permissions } from '#/core/http/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/core/http/decorators/swagger-api-response.decorator';
import { InternalClient } from '#/core/http/internal-client';

import { CreateOAuthIconPresignedUrlCommand } from './create-oauth-icon-presigned-url.command';
import { CreateOAuthIconPresignedUrlRequestDto } from './create-oauth-icon-presigned-url.request.dto';
import { CreateOAuthIconPresignedUrlResponseDto } from './create-oauth-icon-presigned-url.response.dto';

@ApiTags('system-configs')
@UserAuth()
@Controller()
export class SystemConfigOAuthController {
  constructor(private readonly commandBus: CommandBus, private readonly internalClient: InternalClient) {}

  @Post('system-config/oauth-icon/presigned-url')
  @Permissions(AdminPermission.system.update)
  @SwaggerApiResponse(CreateOAuthIconPresignedUrlResponseDto)
  @ApiOperation({ summary: 'OAuth 아이콘 업로드 URL 발급', operationId: 'SystemConfigController_createOAuthIconPresignedUrl_v1' })
  createOAuthIconPresignedUrl(@Body() input: CreateOAuthIconPresignedUrlRequestDto): Promise<CreateOAuthIconPresignedUrlResponseDto> {
    return this.commandBus.execute(new CreateOAuthIconPresignedUrlCommand(input));
  }

  @ApiExcludeEndpoint()
  @Permissions(AdminPermission.system.update)
  @Put('uploads/oauth-icons/:filename')
  @HttpCode(HttpStatus.OK)
  async uploadOAuthIcon(@Param('filename') filename: string, @Req() request: Request): Promise<{ ok: true }> {
    const cleanFilename = this.cleanFilename(filename);
    const body: unknown = request.body;
    if (!Buffer.isBuffer(body) || body.length < 1 || body.length > SECURITY_CONFIG.integrations.oauthIconMaxSizeBytes) {
      throw new BadRequestException(`OAuth 아이콘 파일 크기는 1바이트 이상 ${SECURITY_CONFIG.integrations.oauthIconMaxSizeBytes}바이트 이하여야 합니다.`);
    }
    const contentType = typeof request.headers['content-type'] === 'string' ? request.headers['content-type'] : 'application/octet-stream';
    await this.internalClient.upload(`/internal/system-config/oauth-icons/${cleanFilename}`, body, contentType);
    return { ok: true };
  }

  @ApiExcludeEndpoint()
  @Public()
  @Get('uploads/oauth-icons/:filename')
  async getOAuthIcon(@Param('filename') filename: string, @Res() response: Response): Promise<void> {
    const cleanFilename = this.cleanFilename(filename);
    const file = await this.internalClient.download(`/internal/system-config/oauth-icons/${cleanFilename}`);
    response.setHeader('Content-Type', file.contentType);
    response.setHeader('Cache-Control', `public, max-age=${ADMIN_RUNTIME_CONFIG.oauthIconCacheMaxAgeSeconds}`);
    response.send(file.body);
  }

  private cleanFilename(filename: string): string {
    const cleanFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, '');
    if (!cleanFilename || cleanFilename !== filename) throw new BadRequestException('유효하지 않은 파일명입니다.');
    return cleanFilename;
  }
}
