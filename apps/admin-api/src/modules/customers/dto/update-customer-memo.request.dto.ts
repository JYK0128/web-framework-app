import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class UpdateCustomerMemoRequestDto {
  @ApiProperty({ description: '운영자 내부 메모', maxLength: 5000 })
  @IsString()
  @MaxLength(5000)
  memo!: string;
}
