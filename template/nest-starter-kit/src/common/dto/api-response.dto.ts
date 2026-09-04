import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiBaseResponseDto<T> {
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
  override success = true as const;

  @ApiProperty({ type: 'object', additionalProperties: true, nullable: true })
  override data!: T;

  constructor(partial?: Partial<ApiSuccessResponseDto<T>>) {
    super();
    Object.assign(this, partial);
    this.success = true;
  }
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
  override success = false as const;

  @ApiProperty({ type: 'string' })
  override message!: string;

  @ApiProperty({ nullable: true, default: null })
  override data = null;

  @ApiProperty({ type: 'string' })
  errorCode!: string;

  @ApiPropertyOptional({
    nullable: true,
    type: 'object',
    additionalProperties: true,
    description: 'Validation error details containing fields mapping',
  })
  details?: Record<string, unknown>;

  constructor(partial?: Partial<ApiErrorResponseDto>) {
    super();
    Object.assign(this, partial);
    this.success = false;
    this.data = null;
  }
}
