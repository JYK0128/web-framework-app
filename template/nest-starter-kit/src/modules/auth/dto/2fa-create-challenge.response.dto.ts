import { ApiProperty } from '@nestjs/swagger';

export class Create2FAChallengeResponseDto {
  @ApiProperty()
  token!: string;
}
