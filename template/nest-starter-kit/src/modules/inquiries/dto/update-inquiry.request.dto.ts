import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { ApiEnumOptional } from '#/common/decorators/api-enum.decorator';
import { DtoType } from '#/common/dto/entity-dto';
import { Inquiry, InquiryStatus } from '#/entities/inquiries/inquiry.entity';

export class UpdateInquiryRequestDto extends DtoType(Inquiry) {
  @ApiPropertyOptional({ example: '서비스 이용' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  override category?: string;

  @ApiPropertyOptional({ example: '로그인 문제 해결 요청' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  override title?: string;

  @ApiEnumOptional({ enum: InquiryStatus })
  @IsOptional()
  @IsEnum(InquiryStatus)
  override status?: InquiryStatus;
}
