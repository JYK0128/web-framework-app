import { ApiPropertyOptional } from '@nestjs/swagger';
import { EmailConfigDto, MessengerConfigDto, PushConfigDto, SmsConfigDto } from '@pkg/shared/server';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';

export class DeliveryTestConfigRequestDto {
  @ApiPropertyOptional({ type: EmailConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmailConfigDto)
  email?: EmailConfigDto;

  @ApiPropertyOptional({ type: MessengerConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MessengerConfigDto)
  messenger?: MessengerConfigDto;

  @ApiPropertyOptional({ type: PushConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PushConfigDto)
  push?: PushConfigDto;

  @ApiPropertyOptional({ type: SmsConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SmsConfigDto)
  sms?: SmsConfigDto;
}
