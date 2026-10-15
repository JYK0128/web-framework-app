import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { BaseDto } from '#http/dto/base/base.dto';

// Translation keys are app-owned, so apps can provide their own key union.
export type SuccessCode<TCode extends string = string> = TCode;
export type ErrorCode<TCode extends string = string> = TCode;

export class ApiBaseResponseDto<T, TMessageCode extends string = string> extends BaseDto {
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
  message?: TMessageCode;

  @ApiProperty({ nullable: true })
  data!: T;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  meta?: Record<string, unknown>;
}

export class ApiSuccessResponseDto<T, TSuccessCode extends string = string> extends ApiBaseResponseDto<T, TSuccessCode> {
  @ApiProperty({ type: 'boolean' })
  override success = true as const;

  @ApiProperty({ type: 'object', additionalProperties: true, nullable: true })
  override data!: T;
}

export class ApiValidationErrorDetailDto extends BaseDto {
  @ApiProperty({ type: 'string' })
  property!: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' } })
  constraints?: Record<string, string>;

  @ApiPropertyOptional({ type: () => [ApiValidationErrorDetailDto] })
  children?: ApiValidationErrorDetailDto[];
}

export class ApiErrorResponseDto<TErrorCode extends string = string> extends ApiBaseResponseDto<null> {
  @ApiProperty({ type: 'boolean' })
  override success = false as const;

  @ApiProperty({ type: 'string' })
  override message!: string;

  @ApiProperty({ nullable: true, default: null })
  override data = null;

  @ApiProperty({ type: 'string' })
  errorCode!: ErrorCode<TErrorCode>;

  @ApiPropertyOptional({
    nullable: true,
    type: 'object',
    additionalProperties: true,
    description: 'Validation error details containing fields mapping',
  })
  details?: Record<string, unknown>;
}

export type ApiResponseDto<T, TSuccessCode extends string = string, TErrorCode extends string = string>
  = | ApiSuccessResponseDto<T, TSuccessCode>
    | ApiErrorResponseDto<TErrorCode>;
