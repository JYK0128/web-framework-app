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

  constructor(partial?: Partial<ApiBaseResponseDto<T>>) {
    Object.assign(this, partial);
  }
}

export class ApiSuccessResponseDto<T> extends ApiBaseResponseDto<T> {
  @ApiProperty({ type: 'boolean' })
  override success!: true;

  @ApiProperty({ type: 'object', additionalProperties: true, nullable: true })
  override data!: T;

  constructor(partial?: Partial<ApiSuccessResponseDto<T>>) {
    super(partial);
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
  details?: ApiValidationErrorDetailDto[];

  constructor(partial?: Partial<ApiErrorResponseDto>) {
    super(partial);
    this.success = false;
    this.data = null;
  }
}
