import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class MembershipItemDto {
  @ApiProperty() id!: string;
  @ApiProperty() code!: string;
  @ApiProperty({ type: String, nullable: true }) label!: string | null;
  @ApiProperty({ type: String, nullable: true }) description!: string | null;
  @ApiProperty() isSystem!: boolean;
  @ApiProperty() customerCount!: number;
  @ApiProperty({ type: [String] }) permissions!: string[];
}
export class MembershipPermissionItemDto { @ApiProperty() code!: string; @ApiProperty() resource!: string; @ApiProperty() action!: string; @ApiProperty() label!: string; @ApiPropertyOptional() description?: string; }
export class MembershipPermissionListResponseDto { @ApiProperty({ type: [MembershipPermissionItemDto] }) items!: MembershipPermissionItemDto[]; }
export class MembershipListResponseDto { @ApiProperty({ type: [MembershipItemDto] }) items!: MembershipItemDto[]; }
export class CreateMembershipRequestDto {
  @ApiProperty({ example: 'vip' }) @IsString() @MinLength(1) @MaxLength(50) code!: string;
  @ApiProperty({ example: 'VIP 회원' }) @IsString() @MinLength(1) @MaxLength(100) label!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255) description?: string;
  @ApiPropertyOptional({ type: [String], default: [] }) @IsOptional() @IsString({ each: true }) permissions?: string[];
}
export class UpdateMembershipRequestDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(1) @MaxLength(100) label?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255) description?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsString({ each: true }) permissions?: string[];
}
export class DeleteMembershipResponseDto { @ApiProperty() id!: string; @ApiProperty() deleted!: boolean; }
