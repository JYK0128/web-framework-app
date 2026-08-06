import { ApiProperty } from '@nestjs/swagger';

export class TermsAgreeResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;
}
