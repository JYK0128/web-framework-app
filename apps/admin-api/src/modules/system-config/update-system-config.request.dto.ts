import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base/base.dto';
import { NotificationConfigDto } from '@pkg/server-core/notification/dto';
import { Type } from 'class-transformer';
import { IsObject, IsOptional, Validate, ValidateNested } from 'class-validator';

import { UpdateAdminEmailConfigRequestDto } from '#/modules/system-config/admin-email/update-admin-email-config.request.dto';
import { OAuthConfigDto } from '#/modules/system-config/oauth/oauth-config.dto';
import { OAuthConfigValidator } from '#/modules/system-config/oauth/oauth-config.validator';
import { WebhookConfigDto } from '#/modules/system-config/webhook/webhook-config.dto';

@ApiSchema({ name: 'UpdateSystemSettingsRequestDto' })
export class UpdateSystemConfigRequestDto extends BaseDto {
  @ApiPropertyOptional({ type: WebhookConfigDto }) @IsOptional() @ValidateNested() @Type(() => WebhookConfigDto) webhook?: WebhookConfigDto;
  @ApiPropertyOptional({ type: NotificationConfigDto }) @IsOptional() @ValidateNested() @Type(() => NotificationConfigDto) notification?: NotificationConfigDto;
  @ApiPropertyOptional({ type: OAuthConfigDto }) @IsOptional() @IsObject() @Validate(OAuthConfigValidator) oauth?: OAuthConfigDto;
  @ApiPropertyOptional({ type: UpdateAdminEmailConfigRequestDto }) @IsOptional() @ValidateNested() @Type(() => UpdateAdminEmailConfigRequestDto) adminEmail?: UpdateAdminEmailConfigRequestDto;
}
