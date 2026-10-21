import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetFaqRequestDto extends BaseDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  faqId!: string;
}
