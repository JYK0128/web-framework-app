import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

import { ToLowerCase } from '#/core/http/decorators/to-lower-case.decorator';

export class RequestEmailVerificationRequestDto {
  @ApiProperty({ type: String, format: 'email' })
  @ToLowerCase()
  @IsEmail()
  email!: string;
}
