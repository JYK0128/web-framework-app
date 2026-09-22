import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class ChangePasswordRequestDto {
  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @ApiProperty({ type: String, minLength: 8 })
  @IsString()
  @Length(8, 256)
  newPassword!: string;

  @ApiProperty({ type: String, minLength: 8 })
  @IsString()
  @Length(8, 256)
  confirmPassword!: string;
}

export class ChangePasswordResponseDto {
  @ApiProperty({ type: Boolean })
  ok!: boolean;
}

export class GenerateTwoFactorResponseDto {
  @ApiProperty({ type: String })
  secret!: string;
}

export class EnableTwoFactorRequestDto {
  @ApiProperty({ type: String, minLength: 6, maxLength: 6 })
  @IsString()
  @Length(6, 6)
  code!: string;
}

export class EnableTwoFactorResponseDto {
  @ApiProperty({ type: Boolean })
  enabled!: boolean;
}

export class DisableTwoFactorResponseDto {
  @ApiProperty({ type: Boolean })
  enabled!: boolean;
}

export class UnregisterResponseDto {
  @ApiProperty({ type: Boolean })
  ok!: boolean;
}

export class EmptyProfileSecurityRequestDto {}
