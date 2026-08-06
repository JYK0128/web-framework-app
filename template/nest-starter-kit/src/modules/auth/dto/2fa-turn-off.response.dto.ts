import { ApiProperty } from '@nestjs/swagger';

export class TurnOff2FAResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;
}
