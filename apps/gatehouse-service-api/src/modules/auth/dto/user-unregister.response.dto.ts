import { ApiProperty } from '@nestjs/swagger';

export class UserUnregisterResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;
}
