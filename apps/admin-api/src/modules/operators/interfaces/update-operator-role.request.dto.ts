import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

@ApiSchema({ name: 'OperatorRoleUpdateRequest' })
export class UpdateOperatorRoleRequestDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  role!: string;
}
