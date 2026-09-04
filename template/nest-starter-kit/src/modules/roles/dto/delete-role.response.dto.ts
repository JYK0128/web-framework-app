import { ApiProperty } from '@nestjs/swagger';

export class DeleteRoleResponseDto {
  constructor(id: string, key: string) {
    this.id = id;
    this.key = key;
    this.deleted = true;
  }

  @ApiProperty({ type: 'string' })
  id: string;

  @ApiProperty({ type: 'string' })
  key: string;

  @ApiProperty({ type: 'boolean', example: true })
  deleted: boolean;
}
