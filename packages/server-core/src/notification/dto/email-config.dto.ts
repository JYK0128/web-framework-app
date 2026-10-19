import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDefined, IsString, ValidateNested } from 'class-validator';

import { SmtpEmailDetailsDto } from './smtp-config.dto';

export class EmailConfigDto {
  @ApiProperty({ description: '기본 발신자 명칭 및 발신 이메일 주소', example: 'Service Factory <noreply@example.com>' })
  @IsString()
  from!: string;

  @ApiProperty({ type: SmtpEmailDetailsDto, description: 'SMTP 발송 설정' })
  @IsDefined()
  @ValidateNested()
  @Type(() => SmtpEmailDetailsDto)
  smtp!: SmtpEmailDetailsDto;
}
