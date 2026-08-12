import { ApiProperty } from '@nestjs/swagger';

export class RoleDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'array', items: { type: 'string' } } })
  permissions!: Record<string, string[]>;
}
