import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiBaseResponseDto<T = unknown> {
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

  @ApiPropertyOptional({ description: '응답 메시지', example: '처리가 완료되었습니다.' })
  message?: string;

  @ApiProperty({ description: '응답 데이터', nullable: true })
  data!: T;

  @ApiPropertyOptional({ description: '메타 데이터' })
  meta?: Record<string, unknown>;
}

export class ApiSuccessResponseDto<T> extends ApiBaseResponseDto<T> {
  @ApiProperty({ description: '성공 여부', example: true })
  override success!: true;

  @ApiProperty({ description: '응답 데이터' })
  override data!: T;
}

export class ApiValidationErrorDetailDto {
  @ApiProperty({ description: '검증에 실패한 필드', example: 'email' })
  property!: string;

  @ApiProperty({
    description: '검증 코드별 메시지',
    required: false,
    additionalProperties: { type: 'string' },
    example: { isEmail: '유효한 이메일 주소 형식이 아닙니다.' },
  })
  constraints?: Record<string, string>;

  @ApiProperty({
    description: '중첩된 검증 오류',
    required: false,
    type: () => [ApiValidationErrorDetailDto],
  })
  children?: ApiValidationErrorDetailDto[];
}

export class ApiErrorResponseDto extends ApiBaseResponseDto<null> {
  @ApiProperty({ description: '성공 여부 (에러시 false)', example: false })
  override success!: false;

  @ApiProperty({ description: '에러 코드', example: 'UNAUTHORIZED' })
  errorCode!: string;

  @ApiProperty({ description: '응답 데이터', nullable: true, example: null })
  override data!: null;

  @ApiProperty({ description: '에러 메시지', example: '인증이 필요합니다.' })
  override message!: string;

  @ApiProperty({
    description: '에러 세부 정보',
    required: false,
    nullable: true,
    type: () => [ApiValidationErrorDetailDto],
  })
  details?: unknown;
}

export type ApiSuccessInput<T> = Partial<Pick<
  ApiSuccessResponseDto<T>,
  'statusCode' | 'path' | 'requestId' | 'timestamp' | 'message' | 'meta'
>> & Pick<ApiSuccessResponseDto<T>, 'data'>;

export class ApiSuccessResult<T> {
  readonly success = true as const;
  data!: T;
  statusCode?: number;
  path?: string;
  requestId?: string;
  timestamp?: string;
  message?: string;
  meta?: Record<string, unknown>;

  constructor(input: ApiSuccessInput<T>) {
    Object.assign(this, input);
  }
}

export type ApiErrorInput = Partial<Pick<
  ApiErrorResponseDto,
  'statusCode' | 'path' | 'requestId' | 'timestamp' | 'data' | 'meta' | 'details'
>> & Pick<ApiErrorResponseDto, 'errorCode' | 'message'>;

export class ApiErrorResult {
  readonly success = false as const;
  data: null = null;
  errorCode!: string;
  message!: string;
  statusCode?: number;
  path?: string;
  requestId?: string;
  timestamp?: string;
  meta?: Record<string, unknown>;
  details?: unknown;

  constructor(input: ApiErrorInput) {
    Object.assign(this, input);
    this.data = input.data ?? null;
  }
}

export class ApiResponse {
  static success<T>(input: ApiSuccessInput<T>): ApiSuccessResult<T> {
    return new ApiSuccessResult(input);
  }

  static error(input: ApiErrorInput): ApiErrorResult {
    return new ApiErrorResult(input);
  }
}
