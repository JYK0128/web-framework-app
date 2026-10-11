import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

import { BaseDto } from '#/core/http/dto/base/base.dto';

@ApiSchema({ name: 'OperatorRoleUpdateRequest' })
export class UpdateOperatorRoleRequestDto extends BaseDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  role!: string;
}
