import { ApiProperty } from '@nestjs/swagger';

export class WithdrawOptionalTermResponseDto {
  @ApiProperty()
  ok!: boolean;
}
