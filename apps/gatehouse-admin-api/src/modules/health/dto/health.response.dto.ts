import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status!: string;

  @ApiProperty({ example: 'nest-starter-kit' })
  service!: string;

  @ApiProperty({ example: '2026-08-06T01:13:06.538Z' })
  timestamp!: string;
}
