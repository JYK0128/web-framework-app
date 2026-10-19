import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

@ApiSchema({ name: 'CreateCustomerMembershipRequest' })
export class CreateCustomerMembershipRequestDto {
  @ApiProperty({ example: 'vip' }) @IsString() @MinLength(1) @MaxLength(50) code!: string;
  @ApiProperty({ example: 'VIP 회원' }) @IsString() @MinLength(1) @MaxLength(100) label!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255) description?: string;
  @ApiPropertyOptional({ type: [String], default: [] }) @IsOptional() @IsArray() @IsString({ each: true }) permissions?: string[];
}
