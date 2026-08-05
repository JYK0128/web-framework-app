import { ApiProperty } from '@nestjs/swagger';

export class AgreeOptionalTermRequestDto {
  @ApiProperty()
  termGroupId!: string;
}
