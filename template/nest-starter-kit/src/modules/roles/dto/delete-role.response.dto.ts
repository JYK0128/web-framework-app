import { ApiProperty } from '@nestjs/swagger';

export class DeleteRoleResponseDto {
  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
    this.deleted = true;
  }

  @ApiProperty({ type: 'string' })
  id: string;

  @ApiProperty({ type: 'string' })
  name: string;

  @ApiProperty({ type: 'boolean', example: true })
  deleted: boolean;
}
