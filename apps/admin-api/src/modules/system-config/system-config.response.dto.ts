import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { NotificationConfigDto } from '@pkg/shared/server';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { BaseDto } from '#/core/http/dto/base/base.dto';
import { AdminEmailConfigResponseDto } from '#/modules/system-config/admin-email/admin-email-config.response.dto';
import { OAuthConfigDto } from '#/modules/system-config/oauth/oauth-config.dto';
import { WebhookConfigDto } from '#/modules/system-config/webhook/webhook-config.dto';

@ApiSchema({ name: 'SystemSettingsResponseDto' })
export class SystemConfigResponseDto extends BaseDto {
  @ApiProperty({ type: WebhookConfigDto }) @ValidateNested() @Type(() => WebhookConfigDto) webhook!: WebhookConfigDto;
  @ApiProperty({ type: NotificationConfigDto }) @ValidateNested() @Type(() => NotificationConfigDto) notification!: NotificationConfigDto;
  @ApiProperty({ type: OAuthConfigDto }) @ValidateNested() @Type(() => OAuthConfigDto) oauth!: OAuthConfigDto;
  @ApiProperty({ type: AdminEmailConfigResponseDto }) @ValidateNested() @Type(() => AdminEmailConfigResponseDto) adminEmail!: AdminEmailConfigResponseDto;
}
