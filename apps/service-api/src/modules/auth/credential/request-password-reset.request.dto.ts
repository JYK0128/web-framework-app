import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { ToLowerCase } from '@pkg/server-core/http/decorators/to-lower-case.decorator';
import { normalizePhoneNumber } from '@pkg/shared/common';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

@ApiSchema({ name: 'RequestPasswordResetDto' })
export class RequestPasswordResetRequestDto {
  @ApiProperty({ type: String, format: 'email' })
  @ToLowerCase()
  @IsEmail()
  email!: string;

  @ApiProperty({ type: String, example: '01012345678' })
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? normalizePhoneNumber(value) : value)
  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;
}
