import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

import { ToLowerCase } from '#/core/http/decorators/to-lower-case.decorator';
import { BaseDto } from '#/core/http/dto/base/base.dto';

@ApiSchema({ name: 'EmailVerificationRequestDto' })
export class RequestEmailVerificationRequestDto extends BaseDto {
  @ApiProperty({ example: 'operator@example.com' }) @ToLowerCase() @IsEmail() email!: string;
}
