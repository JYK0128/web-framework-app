import { ApiProperty } from '@nestjs/swagger';

export class UserRegisterResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;
}
