import { ApiProperty } from '@nestjs/swagger';
import { ToLowerCase } from '@pkg/server-core/http/decorators/to-lower-case.decorator';
import { IsEmail } from 'class-validator';

export class RequestEmailVerificationRequestDto {
  @ApiProperty({ type: String, format: 'email' })
  @ToLowerCase()
  @IsEmail()
  email!: string;
}
