import { ApiProperty } from '@nestjs/swagger';

export class UserRegisterResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;
}
