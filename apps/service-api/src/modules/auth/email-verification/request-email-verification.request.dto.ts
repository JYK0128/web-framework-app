import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { ToLowerCase } from '@pkg/server-core/http/decorators';
import { BaseDto } from '@pkg/server-core/http/dto/base';
import { IsEmail } from 'class-validator';

@ApiSchema({ name: 'EmailVerificationRequestDto' })
export class RequestEmailVerificationRequestDto extends BaseDto {
  @ApiProperty({ type: String, format: 'email' })
  @ToLowerCase()
  @IsEmail()
  email!: string;
}
