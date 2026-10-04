import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { BaseDto } from '#/common/interfaces/base/base.dto';
import { ListResponseDto } from '#/common/interfaces/response';

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
export class MembershipPermissionListResponseDto extends ListResponseDto<MembershipPermissionItemDto> { @ApiProperty({ type: [MembershipPermissionItemDto] }) @Type(() => MembershipPermissionItemDto) override items!: MembershipPermissionItemDto[]; }
export class MembershipListResponseDto extends ListResponseDto<MembershipItemDto> { @ApiProperty({ type: [MembershipItemDto] }) @Type(() => MembershipItemDto) override items!: MembershipItemDto[]; }
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
export class DeleteMembershipResponseDto extends BaseDto { @ApiProperty() id!: string; @ApiProperty() deleted!: boolean; }
