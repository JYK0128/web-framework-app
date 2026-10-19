import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base/base.dto';
import { IsString, MaxLength, MinLength } from 'class-validator';

@ApiSchema({ name: 'OperatorRoleUpdateRequest' })
export class UpdateOperatorRoleRequestDto extends BaseDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  role!: string;
}
