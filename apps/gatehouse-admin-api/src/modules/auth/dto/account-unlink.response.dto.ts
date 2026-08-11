import { ApiProperty } from '@nestjs/swagger';

export class AccountUnlinkResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;
}
