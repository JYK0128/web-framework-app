import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiBaseResponseDto<T = unknown> {
  @ApiProperty({ type: 'boolean' })
  success!: boolean;

  @ApiProperty({ type: 'number' })
  statusCode!: number;

  @ApiProperty({ type: 'string' })
  path!: string;

  @ApiProperty({ type: 'string' })
  requestId!: string;

  @ApiProperty({ type: 'string' })
  timestamp!: string;

  @ApiPropertyOptional({ type: 'string' })
  message?: string;

  @ApiProperty({ nullable: true })
  data!: T;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  meta?: Record<string, unknown>;
}
export class ApiSuccessResponseDto<T> extends ApiBaseResponseDto<T> {
  @ApiProperty({ type: 'boolean' })
  override success!: true;

  @ApiProperty({ type: 'object', additionalProperties: true, nullable: true })
  override data!: T;
}
export class ApiValidationErrorDetailDto {
  @ApiProperty({ type: 'string' })
  property!: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' } })
  constraints?: Record<string, string>;

  @ApiPropertyOptional({ type: () => [ApiValidationErrorDetailDto] })
  children?: ApiValidationErrorDetailDto[];
}
export class ApiErrorResponseDto extends ApiBaseResponseDto<null> {
  @ApiProperty({ type: 'boolean' })
  override success!: false;

  @ApiProperty({ type: 'string' })
  errorCode!: string;

  @ApiProperty({ type: 'object', additionalProperties: true, nullable: true })
  override data!: null;

  @ApiProperty({ type: 'string' })
  override message!: string;

  @ApiPropertyOptional({
    nullable: true,
    type: () => [ApiValidationErrorDetailDto],
  })
  details?: unknown;
}
export type ApiSuccessInput<T> = Partial<Pick<ApiSuccessResponseDto<T>, 'statusCode' | 'path' | 'requestId' | 'timestamp' | 'message' | 'meta'>> & Pick<ApiSuccessResponseDto<T>, 'data'>;
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
export type ApiErrorInput = Partial<Pick<ApiErrorResponseDto, 'statusCode' | 'path' | 'requestId' | 'timestamp' | 'data' | 'meta' | 'details'>> & Pick<ApiErrorResponseDto, 'errorCode' | 'message'>;
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
