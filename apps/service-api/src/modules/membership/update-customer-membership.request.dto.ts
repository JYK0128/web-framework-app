import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsArray, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';

@ApiSchema({ name: 'UpdateCustomerMembershipRequest' })
export class UpdateCustomerMembershipRequestDto {
  @ApiPropertyOptional() @ValidateIf((_object, value) => value !== undefined) @IsString() @MinLength(1) @MaxLength(100) label?: string;
  @ApiPropertyOptional() @ValidateIf((_object, value) => value !== undefined) @IsString() @MaxLength(255) description?: string;
  @ApiPropertyOptional({ type: [String] }) @ValidateIf((_object, value) => value !== undefined) @IsArray() @IsString({ each: true }) permissions?: string[];
}
