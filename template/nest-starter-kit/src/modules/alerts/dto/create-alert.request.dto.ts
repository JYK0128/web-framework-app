import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import { ApiEnum } from '#/common/decorators/api-enum.decorator';
import { AlertType } from '#/entities/alerts/alert.entity';

export class CreateAlertRequestDto {
  @ApiProperty({ type: 'string' })
  @IsString()
  userId!: string;

  @ApiEnum({ enum: AlertType })
  @IsEnum(AlertType)
  type!: AlertType;

  @ApiProperty({ type: 'string' })
  @IsString()
  title!: string;

  @ApiProperty({ type: 'string' })
  @IsString()
  content!: string;

  @ApiPropertyOptional({ type: 'string', nullable: true })
  @IsOptional()
  @IsString()
  linkUrl?: string | null;
}
