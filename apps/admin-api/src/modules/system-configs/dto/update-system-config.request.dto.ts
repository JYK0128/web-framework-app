import { ApiPropertyOptional } from '@nestjs/swagger';
import { DeliveryConfigDto } from '@pkg/shared/server';
import { Type } from 'class-transformer';
import { IsObject, IsOptional, ValidateNested } from 'class-validator';

import { BaseDto } from '#/core/http/dto/base/base.dto';
import { InquiryConfigDto } from '#/modules/system-configs/dto/inquiry/inquiry-config.dto';
import { MaintenanceConfigDto } from '#/modules/system-configs/dto/maintenance-config.dto';
import { OAuthConfigDto } from '#/modules/system-configs/dto/oauth-config.dto';
import { OperationConfigDto } from '#/modules/system-configs/dto/operation-config.dto';
import { WebhookConfigDto } from '#/modules/system-configs/dto/webhook/webhook-config.dto';

export class UpdateSystemConfigRequestDto extends BaseDto {
  @ApiPropertyOptional({ type: OperationConfigDto }) @IsOptional() @ValidateNested() @Type(() => OperationConfigDto) operation?: OperationConfigDto;
  @ApiPropertyOptional({ type: MaintenanceConfigDto }) @IsOptional() @ValidateNested() @Type(() => MaintenanceConfigDto) maintenance?: MaintenanceConfigDto;
  @ApiPropertyOptional({ type: InquiryConfigDto }) @IsOptional() @ValidateNested() @Type(() => InquiryConfigDto) inquiry?: InquiryConfigDto;
  @ApiPropertyOptional({ type: WebhookConfigDto }) @IsOptional() @ValidateNested() @Type(() => WebhookConfigDto) webhook?: WebhookConfigDto;
  @ApiPropertyOptional({ type: DeliveryConfigDto }) @IsOptional() @ValidateNested() @Type(() => DeliveryConfigDto) delivery?: DeliveryConfigDto;
  @ApiPropertyOptional({ type: OAuthConfigDto }) @IsOptional() @IsObject() oauth?: OAuthConfigDto;
}
