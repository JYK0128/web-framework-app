import { ApiProperty } from '@nestjs/swagger';

export class TurnOff2FAResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;
}
