import { ApiProperty } from '@nestjs/swagger';

export class TwoFactorTurnOffResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;
}
