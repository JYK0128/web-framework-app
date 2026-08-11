import { ApiProperty } from '@nestjs/swagger';

export class AccountLinkResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;
}
