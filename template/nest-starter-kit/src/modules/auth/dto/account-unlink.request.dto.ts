import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AccountUnlinkRequestDto {
  @ApiProperty({ example: 'google' })
  @IsString()
  @IsNotEmpty()
  providerId!: string;

  @ApiProperty({ example: '104938291048' })
  @IsString()
  @IsNotEmpty()
  accountId!: string;
}
