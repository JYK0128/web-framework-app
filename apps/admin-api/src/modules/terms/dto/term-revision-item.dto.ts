import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import { BaseDto } from '#/core/http/dto/base/base.dto';

@ApiSchema({ name: 'TermRevisionItem' })
export class TermRevisionItemDto extends BaseDto {
  @ApiProperty() id!: string;
  @ApiProperty() version!: string;
  @ApiProperty({ format: 'date-time' }) publishedAt!: Date;
  @ApiProperty() reason!: string;
  @ApiProperty() summary!: string;
  @ApiProperty() content!: string;
}
