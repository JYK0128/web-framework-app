import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { GetCustomersRequestDto } from '#/modules/customers/dto';
export class GetAdminServiceTermsRequestDto extends GetCustomersRequestDto { @ApiPropertyOptional() @IsOptional() @IsString() code?: string; }
