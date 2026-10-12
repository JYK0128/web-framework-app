import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { Permission, Role } from '#/core/database/entities/auth.extensions';
import { EntityDto } from '#/core/http/dto/base/entity.dto';
import { ListResponseDto } from '#/core/http/dto/response';
import { EntityResponseDto } from '#/core/http/dto/response/entity.response.dto';

@ApiSchema({ name: 'CustomerMembershipItem' })
export class CustomerMembershipItemDto extends EntityDto(Role) {
  @ApiProperty() id!: string;
  @ApiProperty() code!: string;
  @ApiProperty({ type: String, nullable: true }) label!: string | null;
  @ApiProperty({ type: String, nullable: true }) description!: string | null;
  @ApiProperty() isSystem!: boolean;
  @ApiProperty() customerCount!: number;
  @ApiProperty({ type: [String] }) permissions!: string[];

  static override parseEntity(role: Role, customerCount: number): CustomerMembershipItemDto {
    return this.parse({ id: role.id, code: role.code, label: role.label, description: role.description, isSystem: role.isSystem, customerCount, permissions: role.permissions ?? [] });
  }
}

@ApiSchema({ name: 'CustomerMembershipPermissionItem' })
export class CustomerMembershipPermissionItemDto extends EntityDto(Permission) {
  @ApiProperty() code!: string;
  @ApiProperty() resource!: string;
  @ApiProperty() action!: string;
  @ApiProperty() label!: string;
  @ApiPropertyOptional() description?: string;

  static override parseEntity(permission: Permission): CustomerMembershipPermissionItemDto {
    const { code, label, description } = permission;
    const separatorIndex = code.indexOf(':');
    return this.parse({ code, resource: separatorIndex > 0 ? code.slice(0, separatorIndex) : code, action: separatorIndex > 0 ? code.slice(separatorIndex + 1) : '', label, description });
  }
}

@ApiSchema({ name: 'CustomerMembershipPermissionListResponse' })
export class CustomerMembershipPermissionListResponseDto extends ListResponseDto<CustomerMembershipPermissionItemDto> {
  @ApiProperty({ type: [CustomerMembershipPermissionItemDto] }) @Type(() => CustomerMembershipPermissionItemDto) items!: CustomerMembershipPermissionItemDto[];
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
export class CustomerMembershipListResponseDto extends ListResponseDto<CustomerMembershipItemDto> {
  @ApiProperty({ type: [CustomerMembershipItemDto] }) @Type(() => CustomerMembershipItemDto) items!: CustomerMembershipItemDto[];
}

@ApiSchema({ name: 'DeleteCustomerMembershipResponse' })
export class DeleteCustomerMembershipResponseDto extends EntityResponseDto(Role) {
  @ApiProperty() id!: string;
  @ApiProperty() deleted!: boolean;

  static override parseEntity(role: Role): DeleteCustomerMembershipResponseDto { return this.parse({ id: role.id, deleted: true }); }
}
