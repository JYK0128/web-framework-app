import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SERVICE_SYSTEM_CONFIG_CODES, type ServiceSystemConfigCode } from '@pkg/shared/common';
import { DeliveryConfigDto } from '@pkg/shared/server';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';

import { BaseDto } from '#/common/interfaces/base/base.dto';

import { InquiryConfigDto } from './dto/inquiry/inquiry-config.dto';
import { MaintenanceConfigDto } from './dto/maintenance-config.dto';
import { OAuthConfigDto } from './dto/oauth-config.dto';
import { OperationConfigDto } from './dto/operation-config.dto';
import { SecurityConfigDto } from './dto/security-config.dto';
import { WebhookConfigDto } from './dto/webhook/webhook-config.dto';

export class SystemConfigResponseDto {
  @ApiProperty({ type: OperationConfigDto }) @ValidateNested() @Type(() => OperationConfigDto) operation!: OperationConfigDto;
  @ApiProperty({ type: MaintenanceConfigDto }) @ValidateNested() @Type(() => MaintenanceConfigDto) maintenance!: MaintenanceConfigDto;
  @ApiProperty({ type: SecurityConfigDto }) @ValidateNested() @Type(() => SecurityConfigDto) security!: SecurityConfigDto;
  @ApiProperty({ type: InquiryConfigDto }) @ValidateNested() @Type(() => InquiryConfigDto) inquiry!: InquiryConfigDto;
  @ApiProperty({ type: WebhookConfigDto }) @ValidateNested() @Type(() => WebhookConfigDto) webhook!: WebhookConfigDto;
  @ApiProperty({ type: DeliveryConfigDto }) @ValidateNested() @Type(() => DeliveryConfigDto) delivery!: DeliveryConfigDto;
  @ApiProperty({ type: OAuthConfigDto }) @ValidateNested() @Type(() => OAuthConfigDto) oauth!: OAuthConfigDto;
}

export class UpdateSystemConfigRequestDto {
  @ApiPropertyOptional({ type: OperationConfigDto }) @IsOptional() @ValidateNested() @Type(() => OperationConfigDto) operation?: OperationConfigDto;
  @ApiPropertyOptional({ type: MaintenanceConfigDto }) @IsOptional() @ValidateNested() @Type(() => MaintenanceConfigDto) maintenance?: MaintenanceConfigDto;
  @ApiPropertyOptional({ type: SecurityConfigDto }) @IsOptional() @ValidateNested() @Type(() => SecurityConfigDto) security?: SecurityConfigDto;
  @ApiPropertyOptional({ type: InquiryConfigDto }) @IsOptional() @ValidateNested() @Type(() => InquiryConfigDto) inquiry?: InquiryConfigDto;
  @ApiPropertyOptional({ type: WebhookConfigDto }) @IsOptional() @ValidateNested() @Type(() => WebhookConfigDto) webhook?: WebhookConfigDto;
  @ApiPropertyOptional({ type: DeliveryConfigDto }) @IsOptional() @ValidateNested() @Type(() => DeliveryConfigDto) delivery?: DeliveryConfigDto;
  @ApiPropertyOptional({ type: OAuthConfigDto }) @IsOptional() @ValidateNested() @Type(() => OAuthConfigDto) oauth?: OAuthConfigDto;
}

export class UpdateSystemConfigResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiProperty({ enum: SERVICE_SYSTEM_CONFIG_CODES, isArray: true })
  updatedKeys!: ServiceSystemConfigCode[];
}

export class SyncSystemConfigRequestDto extends BaseDto {}

export class SyncSystemConfigResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiProperty({ example: '서비스 설정을 Redis에 동기화했습니다.' })
  message!: string;
}
