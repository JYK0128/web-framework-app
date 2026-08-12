import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export class UpdateRolePermissionsRequestDto {
  @ApiProperty({ type: 'object', additionalProperties: { type: 'array', items: { type: 'string' } } })
  @IsObject()
  permissions!: Record<string, string[]>;
}
