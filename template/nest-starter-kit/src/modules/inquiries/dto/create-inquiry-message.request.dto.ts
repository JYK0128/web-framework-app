import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateInquiryMessageRequestDto {
  @ApiProperty({ example: '추가로 확인 부탁드립니다.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  content!: string;
}
