import { ApiProperty } from '@nestjs/swagger';

export class SetAgreementsResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;
}
