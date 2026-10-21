import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base';
import { IsNotEmpty, IsString } from 'class-validator';

@ApiSchema({ name: 'VerifyEmailDto' })
export class VerifyEmailRequestDto extends BaseDto {
  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  challengeId!: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  token!: string;
}
