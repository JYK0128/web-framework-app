import { ApiProperty } from '@nestjs/swagger';

export class UserUnregisterResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;
}
