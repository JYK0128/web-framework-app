import { ApiProperty } from '@nestjs/swagger';

export class TwoFactorTurnOnResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;
}
