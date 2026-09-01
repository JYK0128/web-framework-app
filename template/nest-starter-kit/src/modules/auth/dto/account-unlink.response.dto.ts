import { ApiProperty } from '@nestjs/swagger';

export class AccountUnlinkResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;
}
