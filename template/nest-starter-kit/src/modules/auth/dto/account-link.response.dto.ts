import { ApiProperty } from '@nestjs/swagger';

export class AccountLinkResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;
}
