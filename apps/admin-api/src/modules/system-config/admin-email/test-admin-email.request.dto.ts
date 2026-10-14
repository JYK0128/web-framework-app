import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base/base.dto';
import { IsEmail } from 'class-validator';

export class TestAdminEmailRequestDto extends BaseDto {
  @ApiProperty({ example: 'operator@example.com' })
  @IsEmail()
  to!: string;
}
