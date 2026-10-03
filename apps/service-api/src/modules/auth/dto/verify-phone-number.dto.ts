import { ApiProperty } from '@nestjs/swagger';

import { OkResponseDto } from '#/common/interfaces/response/ok.response.dto';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyPhoneNumberRequestDto {
  @ApiProperty({ type: String, description: 'PortOne verification transaction ID' })
  @IsString()
  @IsNotEmpty()
  identityVerificationId!: string;
}

export class VerifyPhoneNumberResponseDto extends OkResponseDto {}
