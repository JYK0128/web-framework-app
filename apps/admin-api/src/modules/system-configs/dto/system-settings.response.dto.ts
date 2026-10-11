import { ApiProperty } from '@nestjs/swagger';
import { DeliveryConfigDto } from '@pkg/shared/server';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { BaseDto } from '#/core/http/dto/base/base.dto';
import { AdminEmailConfigResponseDto } from '#/modules/system-configs/dto/admin-email/admin-email-config.response.dto';
import { OAuthConfigDto } from '#/modules/system-configs/dto/oauth-config.dto';
import { WebhookConfigDto } from '#/modules/system-configs/dto/webhook/webhook-config.dto';

export class SystemSettingsResponseDto extends BaseDto {
  @ApiProperty({ type: WebhookConfigDto }) @ValidateNested() @Type(() => WebhookConfigDto) webhook!: WebhookConfigDto;
  @ApiProperty({ type: DeliveryConfigDto }) @ValidateNested() @Type(() => DeliveryConfigDto) delivery!: DeliveryConfigDto;
  @ApiProperty({ type: OAuthConfigDto }) @ValidateNested() @Type(() => OAuthConfigDto) oauth!: OAuthConfigDto;
  @ApiProperty({ type: AdminEmailConfigResponseDto }) @ValidateNested() @Type(() => AdminEmailConfigResponseDto) adminEmail!: AdminEmailConfigResponseDto;
}
