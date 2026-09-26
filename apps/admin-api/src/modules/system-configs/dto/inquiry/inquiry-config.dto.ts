import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

import { BaseDto } from '#/common/interfaces/base/base.dto';

export class InquiryConfigDto extends BaseDto {
  @ApiProperty({ example: 10, description: '미응답 문의 감지 기준 시간 (분)' })
  @IsInt()
  @Min(1)
  @Max(120)
  unansweredThresholdMinutes!: number;

  @ApiProperty({ example: 72, description: '문의 자동 종료 기준 시간 (시간)' })
  @IsInt()
  @Min(1)
  @Max(720)
  autoCloseHours!: number;
}
