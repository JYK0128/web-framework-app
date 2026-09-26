import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class TestAdminEmailRequestDto {
  @ApiProperty({ example: 'operator@example.com' })
  @IsEmail()
  to!: string;
}

export class TestAdminEmailResponseDto {
  @ApiProperty() sent!: boolean;
  @ApiProperty() message!: string;
}
