import { ApiProperty } from '@nestjs/swagger';

export class TermsChallengeListRequestDto {
  @ApiProperty()
  token!: string;
}
