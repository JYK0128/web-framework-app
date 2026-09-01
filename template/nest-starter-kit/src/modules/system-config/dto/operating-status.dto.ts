import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

import { ApiEnum } from '#/common/decorators/api-enum.decorator';
import { defineEnum } from '#/common/dto/enum';

export const OperatingStatusCode = defineEnum('OperatingStatusCode', {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  LUNCH_BREAK: 'LUNCH_BREAK',
  HOLIDAY: 'HOLIDAY',
  WEEKEND: 'WEEKEND',
  MAINTENANCE: 'MAINTENANCE',
} as const);

export type OperatingStatusCode = (typeof OperatingStatusCode)[keyof typeof OperatingStatusCode];

export class OperatingStatusDto {
  @ApiProperty({ example: true, description: '현재 업무 운영 중 여부' })
  @IsBoolean()
  isOpen!: boolean;

  @ApiEnum({
    enum: OperatingStatusCode,
    example: OperatingStatusCode.OPEN,
    description: '실시간 운영 상태 코드',
  })
  code!: OperatingStatusCode;

  @ApiProperty({ type: String, example: '현재 점심시간입니다.', description: '실시간 상태 안내 문구', nullable: true })
  @IsString()
  message: string | null = null;
}
