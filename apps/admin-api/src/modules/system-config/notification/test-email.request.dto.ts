import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base';
import { EmailConfigDto } from '@pkg/server-core/notification/dto';
import { Type } from 'class-transformer';
import { IsEmail, IsOptional, ValidateNested } from 'class-validator';

export class TestEmailRequestDto extends BaseDto {
  @ApiProperty({ example: 'operator@example.com' })
  @IsEmail()
  to!: string;

  @ApiPropertyOptional({ type: EmailConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmailConfigDto)
  config?: EmailConfigDto;
}
