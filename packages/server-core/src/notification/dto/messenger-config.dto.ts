import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';

export const MessengerProviderType = {
  KAKAO: 'KAKAO',
  LINE: 'LINE',
  WHATSAPP: 'WHATSAPP',
  TELEGRAM: 'TELEGRAM',
  WECHAT: 'WECHAT',
} as const;

export type MessengerProviderType = (typeof MessengerProviderType)[keyof typeof MessengerProviderType];

export const KakaoAgencyType = {
  NHN_CLOUD: 'NHN_CLOUD',
  SOLAPI: 'SOLAPI',
  ALIGO: 'ALIGO',
} as const;

export type KakaoAgencyType = (typeof KakaoAgencyType)[keyof typeof KakaoAgencyType];

export class KakaoNhnDetailsDto {
  @ApiPropertyOptional({ description: 'NHN Cloud AppKey (알림톡 서비스)', example: 'nhn-app-key-xxx' })
  @IsOptional()
  @IsString()
  appKey?: string;

  @ApiPropertyOptional({ description: 'NHN Cloud SecretKey (알림톡 서비스)', example: 'nhn-secret-key-xxx' })
  @IsOptional()
  @IsString()
  secretKey?: string;
}

export class KakaoSolapiDetailsDto {
  @ApiPropertyOptional({ description: 'Solapi API Key', example: 'NCSI...' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ description: 'Solapi API Secret', example: 'sec_...' })
  @IsOptional()
  @IsString()
  apiSecret?: string;
}

export class KakaoAligoDetailsDto {
  @ApiPropertyOptional({ description: '알리고 회원 아이디', example: 'my_aligo_id' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: '알리고 발급 API Key', example: 'aligo-key-xxx' })
  @IsOptional()
  @IsString()
  apiKey?: string;
}

export class KakaoMessengerDetailsDto {
  @ApiPropertyOptional({ description: '카카오 비즈니스 채널 ID', example: '@service_factory' })
  @IsOptional()
  @IsString()
  plusFriendId?: string;

  @ApiPropertyOptional({ description: '알림톡 발신 프로필 키', example: 'sender-key-1234567890' })
  @IsOptional()
  @IsString()
  senderKey?: string;

  @ApiPropertyOptional({ enum: KakaoAgencyType, description: '알림톡 발송 중계 대행사', example: 'NHN_CLOUD' })
  @IsOptional()
  @IsEnum(KakaoAgencyType)
  agency?: KakaoAgencyType;

  @ApiPropertyOptional({ type: KakaoNhnDetailsDto, description: 'NHN Cloud 알림톡 설정' })
  @IsOptional()
  @ValidateNested()
  @Type(() => KakaoNhnDetailsDto)
  nhn?: KakaoNhnDetailsDto;

  @ApiPropertyOptional({ type: KakaoSolapiDetailsDto, description: '솔라피 알림톡 설정' })
  @IsOptional()
  @ValidateNested()
  @Type(() => KakaoSolapiDetailsDto)
  solapi?: KakaoSolapiDetailsDto;

  @ApiPropertyOptional({ type: KakaoAligoDetailsDto, description: '알리고 알림톡 설정' })
  @IsOptional()
  @ValidateNested()
  @Type(() => KakaoAligoDetailsDto)
  aligo?: KakaoAligoDetailsDto;
}

export class LineMessengerDetailsDto {
  @ApiPropertyOptional({ description: 'LINE Messaging API Channel ID', example: '1234567890' })
  @IsOptional()
  @IsString()
  channelId?: string;

  @ApiPropertyOptional({ description: 'LINE Messaging API Channel Secret', example: 'line-secret-xxx' })
  @IsOptional()
  @IsString()
  channelSecret?: string;

  @ApiPropertyOptional({ description: 'LINE Channel Access Token', example: 'line-token-xxx' })
  @IsOptional()
  @IsString()
  accessToken?: string;
}

export class WhatsAppMessengerDetailsDto {
  @ApiPropertyOptional({ description: 'WhatsApp Business Phone Number ID', example: '10987654321' })
  @IsOptional()
  @IsString()
  phoneNumberId?: string;

  @ApiPropertyOptional({ description: 'WhatsApp Business Account ID', example: '20987654321' })
  @IsOptional()
  @IsString()
  businessAccountId?: string;

  @ApiPropertyOptional({ description: 'WhatsApp Cloud API Access Token', example: 'whatsapp-token-xxx' })
  @IsOptional()
  @IsString()
  accessToken?: string;
}

export class TelegramMessengerDetailsDto {
  @ApiPropertyOptional({ description: 'Telegram Bot Token', example: 'bot123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11' })
  @IsOptional()
  @IsString()
  botToken?: string;

  @ApiPropertyOptional({ description: '기본 발송 대상 Chat ID / 채널 ID', example: '-1001234567890' })
  @IsOptional()
  @IsString()
  chatId?: string;
}

export class WeChatMessengerDetailsDto {
  @ApiPropertyOptional({ description: 'WeChat Official Account AppID', example: 'wx1234567890abcdef' })
  @IsOptional()
  @IsString()
  appId?: string;

  @ApiPropertyOptional({ description: 'WeChat AppSecret', example: 'app-secret-xxx' })
  @IsOptional()
  @IsString()
  appSecret?: string;
}

export class MessengerConfigDto {
  @ApiProperty({ description: '비즈니스 메신저 발송 활성화 여부', example: false })
  @IsBoolean()
  enabled!: boolean;

  @ApiProperty({ enum: MessengerProviderType, description: '선택된 메신저 프로바이더 (단일 선택)', example: 'KAKAO' })
  @IsEnum(MessengerProviderType)
  provider!: MessengerProviderType;

  @ApiPropertyOptional({ type: KakaoMessengerDetailsDto, description: '카카오 알림톡 설정' })
  @IsOptional()
  @ValidateNested()
  @Type(() => KakaoMessengerDetailsDto)
  kakao?: KakaoMessengerDetailsDto;

  @ApiPropertyOptional({ type: LineMessengerDetailsDto, description: 'LINE 메시징 설정' })
  @IsOptional()
  @ValidateNested()
  @Type(() => LineMessengerDetailsDto)
  line?: LineMessengerDetailsDto;

  @ApiPropertyOptional({ type: WhatsAppMessengerDetailsDto, description: 'WhatsApp Cloud API 설정' })
  @IsOptional()
  @ValidateNested()
  @Type(() => WhatsAppMessengerDetailsDto)
  whatsapp?: WhatsAppMessengerDetailsDto;

  @ApiPropertyOptional({ type: TelegramMessengerDetailsDto, description: '텔레그램 봇 설정' })
  @IsOptional()
  @ValidateNested()
  @Type(() => TelegramMessengerDetailsDto)
  telegram?: TelegramMessengerDetailsDto;

  @ApiPropertyOptional({ type: WeChatMessengerDetailsDto, description: '위챗(WeChat) 공식계정 설정' })
  @IsOptional()
  @ValidateNested()
  @Type(() => WeChatMessengerDetailsDto)
  wechat?: WeChatMessengerDetailsDto;
}
