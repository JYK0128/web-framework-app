import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { DeliveryConfigDto } from '@pkg/shared/server';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { BaseDto } from '#/core/http/dto/base/base.dto';
import { OAuthConfigDto } from '#/modules/service-config/oauth/oauth-config.dto';
import { AdminEmailConfigResponseDto } from '#/modules/system-config/admin-email/admin-email-config.response.dto';
import { WebhookConfigDto } from '#/modules/system-config/webhook/webhook-config.dto';

@ApiSchema({ name: 'SystemSettingsResponseDto' })
export class SystemConfigResponseDto extends BaseDto {
  @ApiProperty({ type: WebhookConfigDto }) @ValidateNested() @Type(() => WebhookConfigDto) webhook!: WebhookConfigDto;
  @ApiProperty({ type: DeliveryConfigDto }) @ValidateNested() @Type(() => DeliveryConfigDto) delivery!: DeliveryConfigDto;
  @ApiProperty({ type: OAuthConfigDto }) @ValidateNested() @Type(() => OAuthConfigDto) oauth!: OAuthConfigDto;
  @ApiProperty({ type: AdminEmailConfigResponseDto }) @ValidateNested() @Type(() => AdminEmailConfigResponseDto) adminEmail!: AdminEmailConfigResponseDto;
}
