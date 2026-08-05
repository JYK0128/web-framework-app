import { ApiProperty } from '@nestjs/swagger';

export class WithdrawOptionalTermRequestDto {
  @ApiProperty()
  termGroupId!: string;
}
