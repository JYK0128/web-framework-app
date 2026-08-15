import { ApiProperty } from '@nestjs/swagger';

export class UserActionResponseDto {
  @ApiProperty({ example: true })
  ok!: true;
}
