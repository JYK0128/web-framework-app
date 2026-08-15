import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { Faq } from '#/entities/faqs/faq.entity';

export class CreateFaqRequestDto extends DtoType(Faq) {
  @ApiProperty({ example: '계정/인증', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  override category!: string;

  @ApiProperty({ example: '비밀번호를 재설정하려면 어떻게 하나요?', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  override question!: string;

  @ApiProperty({ example: '로그인 페이지에서 [비밀번호 찾기] 버튼을 클릭하신 후 이메일 인증을 진행해 주세요.' })
  @IsString()
  @IsNotEmpty()
  override answer!: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  override order?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  override isPublished?: boolean;
}
