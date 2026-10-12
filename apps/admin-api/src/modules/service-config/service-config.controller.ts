import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, Query, Req, Res } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminPermission } from '@pkg/shared';
import type { Request, Response } from 'express';

import { ADMIN_RUNTIME_CONFIG, SECURITY_CONFIG } from '#/app.config';
import { Public, UserAuth } from '#/core/http/decorators/auth-mode.decorator';
import { Permissions } from '#/core/http/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/core/http/decorators/swagger-api-response.decorator';
import { InternalClient } from '#/core/http/internal-client';
import { CreateOAuthIconPresignedUrlRequestDto, CreateOAuthIconPresignedUrlResponseDto, GetHolidaysRequestDto, OperatingHolidayListResponseDto, ServiceConfigResponseDto, SyncSystemConfigRequestDto, SyncSystemConfigResponseDto, UpdateServiceConfigRequestDto } from '#/modules/service-config';
import { CreateOAuthIconPresignedUrlCommand } from '#/modules/service-config/oauth/create-oauth-icon-presigned-url.command';
import { GetHolidaysQuery } from '#/modules/service-config/operation/get-holidays.query';
import { SyncSystemConfigCommand } from '#/modules/service-config/sync-system-config.command';
import { UpdateSystemConfigCommand } from '#/modules/service-config/update-system-config.command';
import { UpdateSystemConfigResponseDto } from '#/modules/system-config/update-system-config.response.dto';

import { GetServiceConfigQuery } from './get-service-config.query';
import { GetServiceConfigRequestDto } from './get-service-config.request.dto';

@UserAuth()
@Controller()
export class ServiceConfigController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly internalClient: InternalClient,
  ) {}

  @ApiTags('service-config')
  @Get('service-config')
  @Permissions(AdminPermission.system.read)
  @SwaggerApiResponse(ServiceConfigResponseDto)
  @ApiOperation({ summary: '서비스 설정 조회' })
  async getConfigs(@Query() input: GetServiceConfigRequestDto): Promise<ServiceConfigResponseDto> {
    return this.queryBus.execute(new GetServiceConfigQuery(input));
  }

  @ApiTags('service-config')
  @Get('service-config/holidays')
  @Permissions(AdminPermission.system.read)
  @SwaggerApiResponse(OperatingHolidayListResponseDto)
  @ApiOperation({ summary: '법정 공휴일 조회' })
  getHolidays(@Query() input: GetHolidaysRequestDto): Promise<OperatingHolidayListResponseDto> {
    return this.queryBus.execute(new GetHolidaysQuery({ query: input }));
  }

  @ApiTags('service-config')
  @Patch('service-config')
  @Permissions(AdminPermission.system.update)
  @SwaggerApiResponse(UpdateSystemConfigResponseDto)
  @ApiOperation({ summary: '서비스 설정 전체 수정' })
  updateConfigs(@Body() input: UpdateServiceConfigRequestDto): Promise<UpdateSystemConfigResponseDto> {
    return this.commandBus.execute(new UpdateSystemConfigCommand(input));
  }

  @ApiTags('system-configs')
  @Post('service-config/sync')
  @Permissions(AdminPermission.system.update)
  @SwaggerApiResponse(SyncSystemConfigResponseDto)
  @ApiOperation({ summary: '서비스 설정을 Redis에 동기화', operationId: 'SystemConfigController_syncConfigs_v1' })
  syncConfigs(): Promise<SyncSystemConfigResponseDto> {
    return this.commandBus.execute(new SyncSystemConfigCommand(new SyncSystemConfigRequestDto()));
  }

  @ApiTags('system-configs')
  @Post('service-config/oauth-icon/presigned-url')
  @Permissions(AdminPermission.system.update)
  @SwaggerApiResponse(CreateOAuthIconPresignedUrlResponseDto)
  @ApiOperation({ summary: 'OAuth 아이콘 업로드 URL 발급', operationId: 'SystemConfigController_createOAuthIconPresignedUrl_v1' })
  createOAuthIconPresignedUrl(@Body() input: CreateOAuthIconPresignedUrlRequestDto): Promise<CreateOAuthIconPresignedUrlResponseDto> {
    return this.commandBus.execute(new CreateOAuthIconPresignedUrlCommand(input));
  }

  @ApiExcludeEndpoint()
  @Public()
  @Put('uploads/oauth-icons/:filename')
  @HttpCode(HttpStatus.OK)
  async uploadOAuthIcon(@Param('filename') filename: string, @Req() request: Request): Promise<{ ok: true }> {
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

  @ApiExcludeEndpoint()
  @Public()
  @Get('uploads/oauth-icons/:filename')
  async getOAuthIcon(@Param('filename') filename: string, @Res() response: Response): Promise<void> {
    const cleanFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, '');
    if (!cleanFilename || cleanFilename !== filename) throw new BadRequestException('유효하지 않은 파일명입니다.');
    const file = await this.internalClient.download(`/internal/system-configs/oauth-icons/${cleanFilename}`);
    response.setHeader('Content-Type', file.contentType);
    response.setHeader('Cache-Control', `public, max-age=${ADMIN_RUNTIME_CONFIG.oauthIconCacheMaxAgeSeconds}`);
    response.send(file.body);
  }
}
