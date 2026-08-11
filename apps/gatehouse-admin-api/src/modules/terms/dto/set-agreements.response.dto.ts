import { ApiProperty } from '@nestjs/swagger';

export class SetAgreementsResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;
}
