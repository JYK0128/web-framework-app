import { ApiProperty } from '@nestjs/swagger';

export class LogoutResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;
}
