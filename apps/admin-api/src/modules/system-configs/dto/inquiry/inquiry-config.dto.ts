import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';

import { BaseDto } from '#/common/interfaces/base/base.dto';

export class InquiryConfigDto extends BaseDto {
  @ApiProperty({ example: '안녕하세요! 무엇을 도와 드릴까요?\n궁금한 내용을 남겨 주시면 상담원이 확인해 드리겠습니다.', description: '새 고객지원 상담에 표시할 첫 안내 문구 (최대 500자)' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @Matches(/\S/)
  @MinLength(1)
  @MaxLength(500)
  customerGreeting!: string;

  @ApiProperty({ example: '현재 고객지원 운영시간이 아니어서 답변이 어렵습니다. 운영시간에 확인 후 답변드리겠습니다.', description: '운영시간 외 고객 메시지에 표시할 부재중 응답 문구 (최대 500자)' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @Matches(/\S/)
  @MinLength(1)
  @MaxLength(500)
  offlineReplyMessage!: string;

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
