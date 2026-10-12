import { ApiProperty } from '@nestjs/swagger';
import { DeliveryConfigDto } from '@pkg/shared/server';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { BaseDto } from '#/core/http/dto/base/base.dto';
import { InquiryConfigDto } from '#/modules/service-config/dto/inquiry/inquiry-config.dto';
import { MaintenanceConfigDto } from '#/modules/service-config/dto/maintenance-config.dto';
import { OperationConfigDto } from '#/modules/service-config/dto/operation-config.dto';
import { OAuthConfigDto } from '#/modules/system-config/dto/oauth-config.dto';
import { WebhookConfigDto } from '#/modules/system-config/dto/webhook/webhook-config.dto';

export class SystemConfigResponseDto extends BaseDto {
  @ApiProperty({ type: OperationConfigDto }) @ValidateNested() @Type(() => OperationConfigDto) operation!: OperationConfigDto;
  @ApiProperty({ type: MaintenanceConfigDto }) @ValidateNested() @Type(() => MaintenanceConfigDto) maintenance!: MaintenanceConfigDto;
  @ApiProperty({ type: InquiryConfigDto }) @ValidateNested() @Type(() => InquiryConfigDto) inquiry!: InquiryConfigDto;
  @ApiProperty({ type: WebhookConfigDto }) @ValidateNested() @Type(() => WebhookConfigDto) webhook!: WebhookConfigDto;
  @ApiProperty({ type: DeliveryConfigDto }) @ValidateNested() @Type(() => DeliveryConfigDto) delivery!: DeliveryConfigDto;
  @ApiProperty({ type: OAuthConfigDto }) @ValidateNested() @Type(() => OAuthConfigDto) oauth!: OAuthConfigDto;
}
