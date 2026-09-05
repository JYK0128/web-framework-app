import { ApiProperty } from '@nestjs/swagger';

export class UpdateSystemConfigResponseDto {
  @ApiProperty({ example: true, description: '성공 여부' })
  ok: boolean = true;
}
