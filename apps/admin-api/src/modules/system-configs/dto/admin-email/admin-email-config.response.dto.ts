import { ApiProperty } from '@nestjs/swagger';

import { BaseDto } from '#/core/http/dto/base/base.dto';

export class AdminEmailConfigResponseDto extends BaseDto {
  @ApiProperty() smtpHost!: string;
  @ApiProperty({ minimum: 1, maximum: 65535 }) smtpPort!: number;
  @ApiProperty() smtpSecure!: boolean;
  @ApiProperty() smtpUser!: string;
  @ApiProperty() smtpPasswordConfigured!: boolean;
  @ApiProperty() from!: string;
}
