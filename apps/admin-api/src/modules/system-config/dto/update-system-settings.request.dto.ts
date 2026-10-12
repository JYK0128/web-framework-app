import { ApiPropertyOptional } from '@nestjs/swagger';
import { DeliveryConfigDto } from '@pkg/shared/server';
import { Type } from 'class-transformer';
import { IsObject, IsOptional, ValidateNested } from 'class-validator';

import { BaseDto } from '#/core/http/dto/base/base.dto';
import { UpdateAdminEmailConfigRequestDto } from '#/modules/system-config/dto/admin-email/update-admin-email-config.request.dto';
import { OAuthConfigDto } from '#/modules/system-config/dto/oauth-config.dto';
import { WebhookConfigDto } from '#/modules/system-config/dto/webhook/webhook-config.dto';

export class UpdateSystemSettingsRequestDto extends BaseDto {
  @ApiPropertyOptional({ type: WebhookConfigDto }) @IsOptional() @ValidateNested() @Type(() => WebhookConfigDto) webhook?: WebhookConfigDto;
  @ApiPropertyOptional({ type: DeliveryConfigDto }) @IsOptional() @ValidateNested() @Type(() => DeliveryConfigDto) delivery?: DeliveryConfigDto;
  @ApiPropertyOptional({ type: OAuthConfigDto }) @IsOptional() @IsObject() oauth?: OAuthConfigDto;
  @ApiPropertyOptional({ type: UpdateAdminEmailConfigRequestDto }) @IsOptional() @ValidateNested() @Type(() => UpdateAdminEmailConfigRequestDto) adminEmail?: UpdateAdminEmailConfigRequestDto;
}
