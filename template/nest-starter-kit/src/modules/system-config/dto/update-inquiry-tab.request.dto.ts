import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { SystemConfig } from '#/entities/system-config/system-config.entity';

import { InquiryConfigDto } from './inquiry-config.dto';

export class UpdateInquiryTabRequestDto extends DtoType(SystemConfig) {
  @ApiProperty({ type: InquiryConfigDto, description: '1:1 문의 정책 및 알림 설정' })
  @ValidateNested()
  @Type(() => InquiryConfigDto)
  inquiry!: InquiryConfigDto;
}
