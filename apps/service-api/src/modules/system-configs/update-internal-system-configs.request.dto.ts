import { ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationConfigDto } from '@pkg/shared/server';
import { Type } from 'class-transformer';
import { IsObject, IsOptional, ValidateNested } from 'class-validator';

export class UpdateInternalSystemConfigsRequestDto {
  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  operation?: Record<string, unknown>;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  maintenance?: Record<string, unknown>;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  inquiry?: Record<string, unknown>;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  webhook?: Record<string, unknown>;

  @ApiPropertyOptional({ type: NotificationConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationConfigDto)
  notification?: NotificationConfigDto;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  oauth?: Record<string, unknown>;
}
