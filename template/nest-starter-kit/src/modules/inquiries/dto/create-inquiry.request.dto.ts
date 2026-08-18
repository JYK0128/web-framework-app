import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { Inquiry } from '#/entities/inquiries/inquiry.entity';

export class CreateInquiryRequestDto extends DtoType(Inquiry) {
  @ApiProperty({ example: '서비스 이용', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  override category!: string;

  @ApiProperty({ example: '로그인이 되지 않습니다.', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  override title!: string;

  @ApiProperty({ example: '오늘 오전부터 로그인이 되지 않고 있습니다.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  override content!: string;
}
