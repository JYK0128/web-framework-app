import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base/base.dto';
import { IsNotEmpty, IsString } from 'class-validator';

@ApiSchema({ name: 'VerifyPasswordResetDto' })
export class VerifyPasswordResetRequestDto extends BaseDto {
  @ApiProperty() @IsString() @IsNotEmpty() challengeId!: string;
  @ApiProperty() @IsString() @IsNotEmpty() token!: string;
}
