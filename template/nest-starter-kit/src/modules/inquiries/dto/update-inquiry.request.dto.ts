import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { ApiEnumOptional } from '#/common/decorators/api-enum.decorator';
import { DtoType } from '#/common/dto/entity-dto';
import { Inquiry, InquiryStatus } from '#/entities/inquiries/inquiry.entity';

export class UpdateInquiryRequestDto extends DtoType(Inquiry) {
  @ApiPropertyOptional({ type: 'string' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  override category?: string;

  @ApiPropertyOptional({ type: 'string' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  override title?: string;

  @ApiEnumOptional({ enum: InquiryStatus })
  @IsOptional()
  @IsEnum(InquiryStatus)
  override status?: InquiryStatus;
}
