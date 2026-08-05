import { ApiProperty } from '@nestjs/swagger';

export class AgreeOptionalTermResponseDto {
  @ApiProperty()
  ok!: boolean;
}
