import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base/base.dto';
import { AlimtalkMessageDto, MessengerConfigDto } from '@pkg/shared/server';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class TestMessengerRequestDto extends BaseDto {
  @ApiProperty({ example: 'recipient-id' })
  @IsString()
  @IsNotEmpty()
  recipient!: string;

  @ApiPropertyOptional({ type: AlimtalkMessageDto, description: '카카오 알림톡 테스트 시 필수' })
  @IsOptional()
  @ValidateNested()
  @Type(() => AlimtalkMessageDto)
  alimtalk?: AlimtalkMessageDto;

  @ApiPropertyOptional({ type: MessengerConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MessengerConfigDto)
  config?: MessengerConfigDto;
}
