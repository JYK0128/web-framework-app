import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { DeliveryConfigDto } from '@pkg/shared/server';
import { Type } from 'class-transformer';
import { IsObject, IsOptional, ValidateNested } from 'class-validator';

import { BaseDto } from '#/core/http/dto/base/base.dto';
import { OAuthConfigDto } from '#/modules/service-config/oauth/oauth-config.dto';
import { UpdateAdminEmailConfigRequestDto } from '#/modules/system-config/admin-email/update-admin-email-config.request.dto';
import { WebhookConfigDto } from '#/modules/system-config/webhook/webhook-config.dto';

@ApiSchema({ name: 'UpdateSystemSettingsRequestDto' })
export class UpdateSystemConfigRequestDto extends BaseDto {
  @ApiPropertyOptional({ type: WebhookConfigDto }) @IsOptional() @ValidateNested() @Type(() => WebhookConfigDto) webhook?: WebhookConfigDto;
  @ApiPropertyOptional({ type: DeliveryConfigDto }) @IsOptional() @ValidateNested() @Type(() => DeliveryConfigDto) delivery?: DeliveryConfigDto;
  @ApiPropertyOptional({ type: OAuthConfigDto }) @IsOptional() @IsObject() oauth?: OAuthConfigDto;
  @ApiPropertyOptional({ type: UpdateAdminEmailConfigRequestDto }) @IsOptional() @ValidateNested() @Type(() => UpdateAdminEmailConfigRequestDto) adminEmail?: UpdateAdminEmailConfigRequestDto;
}
