import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base/base.dto';
import { IsString, MaxLength } from 'class-validator';

export class UpdateCustomerMemoRequestDto extends BaseDto {
  @ApiProperty({ description: '운영자 내부 메모', maxLength: 5000 })
  @IsString()
  @MaxLength(5000)
  memo!: string;
}
