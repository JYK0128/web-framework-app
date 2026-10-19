import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';

export const SmsProviderType = {
  NHN_SMS: 'NHN_SMS',
  SOLAPI_SMS: 'SOLAPI_SMS',
  ALIGO_SMS: 'ALIGO_SMS',
} as const;

export type SmsProviderType = (typeof SmsProviderType)[keyof typeof SmsProviderType];

export class NhnSmsDetailsDto {
  @ApiPropertyOptional({ description: 'NHN Cloud SMS AppKey', example: 'nhn-sms-app-key-xxx' })
  @IsOptional()
  @IsString()
  appKey?: string;

  @ApiPropertyOptional({ description: 'NHN Cloud SMS SecretKey', example: 'nhn-sms-secret-key-xxx' })
  @IsOptional()
  @IsString()
  secretKey?: string;

  @ApiPropertyOptional({ description: '사전 등록된 대표 발신번호', example: '1588-0000' })
  @IsOptional()
  @IsString()
  senderPhone?: string;
}

export class SolapiSmsDetailsDto {
  @ApiPropertyOptional({ description: 'Solapi API Key', example: 'NCSI...' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ description: 'Solapi API Secret', example: 'sec_...' })
  @IsOptional()
  @IsString()
  apiSecret?: string;

  @ApiPropertyOptional({ description: '사전 등록된 대표 발신번호', example: '02-1234-5678' })
  @IsOptional()
  @IsString()
  senderPhone?: string;
}

export class AligoSmsDetailsDto {
  @ApiPropertyOptional({ description: '알리고 회원 아이디', example: 'my_aligo_id' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: '알리고 발급 API Key', example: 'aligo-key-xxx' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ description: '사전 등록된 대표 발신번호', example: '02-1234-5678' })
  @IsOptional()
  @IsString()
  sender?: string;
}

export class SmsConfigDto {
  @ApiProperty({ description: 'SMS 문자 발송 활성화 여부', example: false })
  @IsBoolean()
  enabled!: boolean;

  @ApiProperty({ enum: SmsProviderType, description: '선택된 SMS 발송 제공자', example: 'NHN_SMS' })
  @IsEnum(SmsProviderType)
  provider!: SmsProviderType;

  @ApiPropertyOptional({ type: NhnSmsDetailsDto, description: 'NHN Cloud SMS 설정' })
  @IsOptional()
  @ValidateNested()
  @Type(() => NhnSmsDetailsDto)
  nhn?: NhnSmsDetailsDto;

  @ApiPropertyOptional({ type: SolapiSmsDetailsDto, description: '솔라피(Solapi) SMS 설정' })
  @IsOptional()
  @ValidateNested()
  @Type(() => SolapiSmsDetailsDto)
  solapi?: SolapiSmsDetailsDto;

  @ApiPropertyOptional({ type: AligoSmsDetailsDto, description: '알리고(Aligo) SMS 설정' })
  @IsOptional()
  @ValidateNested()
  @Type(() => AligoSmsDetailsDto)
  aligo?: AligoSmsDetailsDto;
}
