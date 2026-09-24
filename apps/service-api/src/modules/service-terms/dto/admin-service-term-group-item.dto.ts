import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { BaseDto } from '#/common/dto/base.dto';

@ApiSchema({ name: 'AdminServiceTermGroupItem' })
export class AdminServiceTermGroupItemDto extends BaseDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() isRequired!: boolean;
  @ApiProperty() sortOrder!: number;
  @ApiProperty({ format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ format: 'date-time' }) updatedAt!: Date;
}
