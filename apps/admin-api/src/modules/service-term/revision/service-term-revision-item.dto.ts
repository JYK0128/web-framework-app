import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base';

export class ServiceTermRevisionItemDto extends BaseDto {
  @ApiProperty() id!: string;

  @ApiProperty() version!: string;

  @ApiProperty({ format: 'date-time' }) publishedAt!: Date;

  @ApiProperty() reason!: string;

  @ApiProperty() summary!: string;

  @ApiProperty() content!: string;
}
