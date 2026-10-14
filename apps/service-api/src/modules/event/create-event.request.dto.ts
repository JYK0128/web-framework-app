import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

@ApiSchema({ name: 'CreateEventRequest' })
export class CreateEventRequestDto {
  static readonly richTextFields = ['content'];
  @ApiProperty({ type: String, maxLength: 255 }) @IsString() @IsNotEmpty() @MaxLength(255) title!: string;
  @ApiProperty({ type: String }) @IsString() @IsNotEmpty() content!: string;
  @ApiProperty({ type: String, format: 'date-time' }) @Type(() => Date) @IsDate() startsAt!: Date;
  @ApiProperty({ type: String, format: 'date-time' }) @Type(() => Date) @IsDate() endsAt!: Date;
  @ApiPropertyOptional({ type: String, maxLength: 500 }) @IsOptional() @IsUrl({ require_tld: false }) @MaxLength(500) imageUrl?: string | null;
  @ApiPropertyOptional({ type: String, maxLength: 500 }) @IsOptional() @IsUrl({ require_tld: false }) @MaxLength(500) linkUrl?: string | null;
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true }) @IsOptional() @Type(() => Date) @IsDate() publishedAt?: Date | null;
}
