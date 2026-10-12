import { ApiProperty } from '@nestjs/swagger';

import { BaseDto } from '#/core/http/dto/base/base.dto';

export class LogErrorInfoDto extends BaseDto {
  @ApiProperty({ description: '에러/예외 클래스명 (예: ApplicationError, TypeError)' })
  name!: string;

  @ApiProperty({ type: String, nullable: true, description: '비즈니스 에러 코드 (예: INVALID_TOKEN)' })
  code!: string | null;

  @ApiProperty({ description: '에러 메시지' })
  message!: string;

  @ApiProperty({ type: Object, nullable: true, additionalProperties: true, description: '유효성 검사 등 상세 에러 내역' })
  details!: unknown;

  @ApiProperty({ type: String, nullable: true, description: '에러 호출 스택 트레이스' })
  stack!: string | null;

  @ApiProperty({ type: String, nullable: true, description: 'DB 예외 시 실행 SQL 쿼리' })
  sql!: string | null;
}
