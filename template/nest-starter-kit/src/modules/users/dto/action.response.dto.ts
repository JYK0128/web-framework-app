import { ApiProperty } from '@nestjs/swagger';

export class UserActionResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: true;
}
