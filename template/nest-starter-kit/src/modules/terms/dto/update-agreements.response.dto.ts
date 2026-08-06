import { ApiProperty } from '@nestjs/swagger';

export class UpdateAgreementsResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;
}
