import { ApiProperty } from '@nestjs/swagger';

export class TurnOn2FAResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;
}
