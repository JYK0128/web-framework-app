import { ApiProperty } from '@nestjs/swagger';

export class TurnOn2FAResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;
}
