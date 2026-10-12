import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

@ApiSchema({ name: 'RequestPasswordResetDto' })
export class RequestPasswordResetRequestDto {
  @ApiProperty({ type: String, format: 'email' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  email!: string;

  @ApiProperty({ type: String, example: '01012345678' })
  @Transform(({ value }) => typeof value === 'string' ? value.replace(/[^0-9+]/g, '') : value)
  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;
}
