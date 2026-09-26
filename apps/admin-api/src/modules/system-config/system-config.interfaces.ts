import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';

import { BaseDto } from '#/common/interfaces/base/base.dto';
import { SystemConfigCode } from '#/entities/system-configs/system-config.entity';

import { InquiryConfigDto } from './dto/inquiry-config.dto';
import { MaintenanceConfigDto } from './dto/maintenance-config.dto';
import { NotificationConfigDto } from './dto/notification-config.dto';
import { OAuthConfigDto } from './dto/oauth-config.dto';
import { OperationConfigDto } from './dto/operation-config.dto';
import { SecurityConfigDto } from './dto/security-config.dto';

export class SystemConfigResponseDto {
  @ApiProperty({ type: OperationConfigDto }) @ValidateNested() @Type(() => OperationConfigDto) operation!: OperationConfigDto;
  @ApiProperty({ type: MaintenanceConfigDto }) @ValidateNested() @Type(() => MaintenanceConfigDto) maintenance!: MaintenanceConfigDto;
  @ApiProperty({ type: SecurityConfigDto }) @ValidateNested() @Type(() => SecurityConfigDto) security!: SecurityConfigDto;
  @ApiProperty({ type: InquiryConfigDto }) @ValidateNested() @Type(() => InquiryConfigDto) inquiry!: InquiryConfigDto;
  @ApiProperty({ type: NotificationConfigDto }) @ValidateNested() @Type(() => NotificationConfigDto) notification!: NotificationConfigDto;
  @ApiProperty({ type: OAuthConfigDto }) @ValidateNested() @Type(() => OAuthConfigDto) oauth!: OAuthConfigDto;
}

export class UpdateSystemConfigRequestDto {
  @ApiPropertyOptional({ type: OperationConfigDto }) @IsOptional() @ValidateNested() @Type(() => OperationConfigDto) operation?: OperationConfigDto;
  @ApiPropertyOptional({ type: MaintenanceConfigDto }) @IsOptional() @ValidateNested() @Type(() => MaintenanceConfigDto) maintenance?: MaintenanceConfigDto;
  @ApiPropertyOptional({ type: SecurityConfigDto }) @IsOptional() @ValidateNested() @Type(() => SecurityConfigDto) security?: SecurityConfigDto;
  @ApiPropertyOptional({ type: InquiryConfigDto }) @IsOptional() @ValidateNested() @Type(() => InquiryConfigDto) inquiry?: InquiryConfigDto;
  @ApiPropertyOptional({ type: NotificationConfigDto }) @IsOptional() @ValidateNested() @Type(() => NotificationConfigDto) notification?: NotificationConfigDto;
  @ApiPropertyOptional({ type: OAuthConfigDto }) @IsOptional() @ValidateNested() @Type(() => OAuthConfigDto) oauth?: OAuthConfigDto;
}

export class UpdateSystemConfigResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiProperty({ enum: SystemConfigCode, isArray: true })
  updatedKeys!: SystemConfigCode[];
}

export class SyncSystemConfigRequestDto extends BaseDto {}

export class SyncSystemConfigResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiProperty({ example: '서비스 설정을 Redis에 동기화했습니다.' })
  message!: string;
}
