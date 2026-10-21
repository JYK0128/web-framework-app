import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base';
import { IsString } from 'class-validator';

export class OperatingMessagesDto extends BaseDto {
  @ApiProperty({ example: '현재 점심시간입니다.', description: '점심시간 안내 문구' })
  @IsString()
  lunch!: string;

  @ApiProperty({ example: '현재는 운영시간 외입니다.', description: '운영시간 외 안내 문구' })
  @IsString()
  offHours!: string;

  @ApiProperty({ example: '주말 및 공휴일은 고객센터 휴무입니다.', description: '휴일 안내 문구' })
  @IsString()
  holiday!: string;
}
