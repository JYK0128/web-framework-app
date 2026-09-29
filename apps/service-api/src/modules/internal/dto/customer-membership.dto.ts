import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { BaseDto } from '#/common/dto/base.dto';

@ApiSchema({ name: 'CustomerMembershipItem' })
export class CustomerMembershipItemDto extends BaseDto {
  @ApiProperty() id!: string;
  @ApiProperty() code!: string;
  @ApiProperty({ type: String, nullable: true }) label!: string | null;
  @ApiProperty({ type: String, nullable: true }) description!: string | null;
  @ApiProperty() isSystem!: boolean;
  @ApiProperty() customerCount!: number;
  @ApiProperty({ type: [String] }) permissions!: string[];
}

@ApiSchema({ name: 'CustomerMembershipPermissionItem' })
export class CustomerMembershipPermissionItemDto {
  @ApiProperty() code!: string;
  @ApiProperty() resource!: string;
  @ApiProperty() action!: string;
  @ApiProperty() label!: string;
  @ApiPropertyOptional() description?: string;
}

@ApiSchema({ name: 'CustomerMembershipPermissionListResponse' })
export class CustomerMembershipPermissionListResponseDto extends BaseDto {
  @ApiProperty({ type: [CustomerMembershipPermissionItemDto] }) items!: CustomerMembershipPermissionItemDto[];
}

@ApiSchema({ name: 'CreateCustomerMembershipRequest' })
export class CreateCustomerMembershipRequestDto {
  @ApiProperty({ example: 'vip' }) @IsString() @MinLength(1) @MaxLength(50) code!: string;
  @ApiProperty({ example: 'VIP 회원' }) @IsString() @MinLength(1) @MaxLength(100) label!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255) description?: string;
  @ApiPropertyOptional({ type: [String], default: [] }) @IsOptional() @IsString({ each: true }) permissions?: string[];
}

@ApiSchema({ name: 'UpdateCustomerMembershipRequest' })
export class UpdateCustomerMembershipRequestDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(1) @MaxLength(100) label?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255) description?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsString({ each: true }) permissions?: string[];
}

@ApiSchema({ name: 'CustomerMembershipListResponse' })
export class CustomerMembershipListResponseDto extends BaseDto {
  @ApiProperty({ type: [CustomerMembershipItemDto] }) items!: CustomerMembershipItemDto[];
}

@ApiSchema({ name: 'DeleteCustomerMembershipResponse' })
export class DeleteCustomerMembershipResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() deleted!: boolean;
}
