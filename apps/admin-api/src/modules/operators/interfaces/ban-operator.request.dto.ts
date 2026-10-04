import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate, IsOptional, IsString, MaxLength } from 'class-validator';

@ApiSchema({ name: 'OperatorBanRequest' })
export class BanOperatorRequestDto {
  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', description: '미입력 시 무기한 정지' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number') return new Date(value);
    return value;
  })
  @IsDate()
  expiresAt?: Date;
}
