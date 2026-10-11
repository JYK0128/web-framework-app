import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

import { OkResponseDto } from '#/core/http/dto/response/ok.response.dto';

export class TestAdminEmailRequestDto {
  @ApiProperty({ example: 'operator@example.com' })
  @IsEmail()
  to!: string;
}

export class TestAdminEmailResponseDto extends OkResponseDto {}
