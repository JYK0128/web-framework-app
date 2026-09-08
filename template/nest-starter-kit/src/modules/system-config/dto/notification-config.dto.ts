import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

import { Secret } from '#/common/decorators/secret.decorator';

export class SmtpEmailDetailsDto {
  @ApiPropertyOptional({ description: 'SMTP 호스트 서버 주소', example: 'smtp.gmail.com' })
  @IsOptional()
  @IsString()
  host?: string;

  @ApiPropertyOptional({ description: 'SMTP 포트 번호', example: 587 })
  @IsOptional()
  @IsNumber()
  port?: number;

  @ApiPropertyOptional({ description: 'SSL/TLS 보안 연결 사용 여부', example: false })
  @IsOptional()
  @IsBoolean()
  secure?: boolean;

  @ApiPropertyOptional({ description: 'SMTP 인증 계정(이메일 또는 아이디)', example: 'user@example.com' })
  @IsOptional()
  @IsString()
  user?: string;

  @ApiPropertyOptional({ description: 'SMTP 인증 비밀번호(수정 시에만 전달)', example: 'password123' })
  @IsOptional()
  @IsString()
  @Secret()
  pass?: string;
}

export class EmailConfigDto {
  @ApiProperty({ description: '기본 발신자 명칭 및 발신 이메일 주소', example: 'Service Factory <noreply@example.com>' })
  @IsString()
  from!: string;

  @ApiPropertyOptional({ type: SmtpEmailDetailsDto, description: 'SMTP 발송 설정' })
  @IsOptional()
  @ValidateNested()
  @Type(() => SmtpEmailDetailsDto)
  smtp?: SmtpEmailDetailsDto;
}

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
  @Secret()
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
  @Secret()
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
  @Secret()
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
  @Secret()
  channelSecret?: string;

  @ApiPropertyOptional({ description: 'LINE Channel Access Token', example: 'line-token-xxx' })
  @IsOptional()
  @IsString()
  @Secret()
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
  @Secret()
  accessToken?: string;
}

export class TelegramMessengerDetailsDto {
  @ApiPropertyOptional({ description: 'Telegram Bot Token', example: 'bot123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11' })
  @IsOptional()
  @IsString()
  @Secret()
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
  @Secret()
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
  @Secret()
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
  @Secret()
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
  @Secret()
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

export const PushProviderType = {
  FCM: 'FCM',
  NHN_PUSH: 'NHN_PUSH',
} as const;

export type PushProviderType = (typeof PushProviderType)[keyof typeof PushProviderType];

export class FcmPushDetailsDto {
  @ApiPropertyOptional({ description: 'Firebase Project ID', example: 'service-factory-app' })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Firebase Web API Key' })
  @IsOptional()
  @IsString()
  @Secret()
  apiKey?: string;
}

export class NhnPushDetailsDto {
  @ApiPropertyOptional({ description: 'NHN Cloud Push AppKey', example: 'nhn-push-app-key-xxx' })
  @IsOptional()
  @IsString()
  appKey?: string;

  @ApiPropertyOptional({ description: 'NHN Cloud User Access Key ID' })
  @IsOptional()
  @IsString()
  userAccessKeyId?: string;

  @ApiPropertyOptional({ description: 'NHN Cloud Secret Access Key' })
  @IsOptional()
  @IsString()
  @Secret()
  secretAccessKey?: string;
}

export class PushConfigDto {
  @ApiProperty({ description: '웹 푸시/FCM 활성화 여부', example: false })
  @IsBoolean()
  enabled!: boolean;

  @ApiProperty({ enum: PushProviderType, description: '선택된 푸시 알림 제공자', example: 'FCM' })
  @IsEnum(PushProviderType)
  provider!: PushProviderType;

  @ApiPropertyOptional({ type: FcmPushDetailsDto, description: 'Firebase Cloud Messaging 설정' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FcmPushDetailsDto)
  fcm?: FcmPushDetailsDto;

  @ApiPropertyOptional({ type: NhnPushDetailsDto, description: 'NHN Cloud Push 설정' })
  @IsOptional()
  @ValidateNested()
  @Type(() => NhnPushDetailsDto)
  nhn?: NhnPushDetailsDto;
}

export class NotificationConfigDto {
  @ApiProperty({ type: EmailConfigDto, description: '이메일 발송 설정' })
  @ValidateNested()
  @Type(() => EmailConfigDto)
  email!: EmailConfigDto;

  @ApiProperty({ type: MessengerConfigDto, description: '비즈니스 메신저 (카카오/라인/왓츠앱/텔레그램/위챗 중 택 1) 발송 설정' })
  @ValidateNested()
  @Type(() => MessengerConfigDto)
  messenger!: MessengerConfigDto;

  @ApiProperty({ type: SmsConfigDto, description: 'SMS 문자 발송 설정' })
  @ValidateNested()
  @Type(() => SmsConfigDto)
  sms!: SmsConfigDto;

  @ApiProperty({ type: PushConfigDto, description: '웹/모바일 푸시 알림 설정' })
  @ValidateNested()
  @Type(() => PushConfigDto)
  push!: PushConfigDto;
}
