import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

import { PAGINATION_DEFAULT_LIMIT, PAGINATION_DEFAULT_PAGE, PAGINATION_MAX_LIMIT } from '#/app.config';
import { BaseDto } from '#/common/interfaces/base';

const toNumber = ({ value }: { value: unknown }) => Number(value);

export class GetLogsRequestDto extends BaseDto {
  @ApiPropertyOptional({ default: PAGINATION_DEFAULT_PAGE }) @IsOptional() @Transform(toNumber) @IsInt() @Min(1) page = PAGINATION_DEFAULT_PAGE;
  @ApiPropertyOptional({ default: PAGINATION_DEFAULT_LIMIT, maximum: PAGINATION_MAX_LIMIT }) @IsOptional() @Transform(toNumber) @IsInt() @Min(1) @Max(PAGINATION_MAX_LIMIT) limit = PAGINATION_DEFAULT_LIMIT;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() method?: string;
  @ApiPropertyOptional({ enum: ['error', 'success'] }) @IsOptional() @IsIn(['error', 'success']) status?: string;
}
