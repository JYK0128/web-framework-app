import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base';
import { NotificationConfigDto } from '@pkg/server-core/notification/dto';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { InquiryConfigDto } from '~/modules/service-config/inquiry/inquiry-config.dto';
import { MaintenanceConfigDto } from '~/modules/service-config/maintenance/maintenance-config.dto';
import { OperationConfigDto } from '~/modules/service-config/operation/operation-config.dto';
import { OAuthConfigDto } from '~/modules/system-config/oauth/oauth-config.dto';

@ApiSchema({ name: 'SystemConfigResponseDto' })
export class ServiceSystemConfigResponseDto extends BaseDto {
  @ApiProperty({ type: OperationConfigDto }) @ValidateNested() @Type(() => OperationConfigDto) operation!: OperationConfigDto;
  @ApiProperty({ type: MaintenanceConfigDto }) @ValidateNested() @Type(() => MaintenanceConfigDto) maintenance!: MaintenanceConfigDto;
  @ApiProperty({ type: InquiryConfigDto }) @ValidateNested() @Type(() => InquiryConfigDto) inquiry!: InquiryConfigDto;
  @ApiProperty({ type: NotificationConfigDto }) @ValidateNested() @Type(() => NotificationConfigDto) notification!: NotificationConfigDto;
  @ApiProperty({ type: OAuthConfigDto }) @ValidateNested() @Type(() => OAuthConfigDto) oauth!: OAuthConfigDto;
}
