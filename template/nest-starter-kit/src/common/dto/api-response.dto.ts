import { ApiProperty } from '@nestjs/swagger';

export class ApiBaseResponseDto {
  @ApiProperty({ description: '성공 여부', example: true })
  success!: boolean;

  @ApiProperty({ description: 'HTTP 상태 코드', example: 200 })
  statusCode!: number;

  @ApiProperty({ description: '요청 경로', example: '/api/v1/auth/me' })
  path!: string;

  @ApiProperty({ description: '요청 ID', example: 'req-123456789' })
  requestId!: string;

  @ApiProperty({ description: '응답 생성 일시', example: '2026-08-06T12:00:00.000Z' })
  timestamp!: string;
}

export class ApiSuccessResponseDto<T> extends ApiBaseResponseDto {
  @ApiProperty({ description: '성공 여부', example: true })
  override success!: true;

  @ApiProperty({ description: '응답 데이터' })
  data!: T;

  @ApiProperty({ description: '메타 데이터', required: false })
  meta?: Record<string, unknown>;
}

export class ApiErrorResponseDto extends ApiBaseResponseDto {
  @ApiProperty({ description: '성공 여부 (에러시 false)', example: false })
  override success!: false;

  @ApiProperty({ description: '에러 코드', example: 'UNAUTHORIZED' })
  errorCode!: string;

  @ApiProperty({ description: '에러 메시지', example: '인증이 필요합니다.' })
  message!: string;

  @ApiProperty({ description: '에러 세부 정보', required: false, nullable: true })
  details?: unknown;
}

export class ApiResponse {
  static success<T>(
    data: T,
    statusCode: number,
    path: string,
    requestId: string,
    meta?: Record<string, unknown>,
  ): ApiSuccessResponseDto<T> {
    return {
      success: true,
      statusCode,
      path,
      requestId,
      timestamp: new Date().toISOString(),
      data,
      ...(meta && { meta }),
    };
  }

  static error(
    errorCode: string,
    message: string,
    statusCode: number,
    path: string,
    requestId: string,
    details?: unknown,
  ): ApiErrorResponseDto {
    return {
      success: false,
      statusCode,
      path,
      requestId,
      timestamp: new Date().toISOString(),
      errorCode,
      message,
      ...(details !== undefined && { details }),
    };
  }
}
