import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

import { OkResponseDto } from '#/common/interfaces/response';

export class TestAdminEmailRequestDto {
  @ApiProperty({ example: 'operator@example.com' })
  @IsEmail()
  to!: string;
}

export class TestAdminEmailResponseDto extends OkResponseDto {}
