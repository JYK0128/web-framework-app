import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { ToLowerCase } from '@pkg/server-core/http/decorators/to-lower-case.decorator';
import { BaseDto } from '@pkg/server-core/http/dto/base/base.dto';
import { IsEmail } from 'class-validator';

@ApiSchema({ name: 'EmailVerificationRequestDto' })
export class RequestEmailVerificationRequestDto extends BaseDto {
  @ApiProperty({ example: 'operator@example.com' }) @ToLowerCase() @IsEmail() email!: string;
}
