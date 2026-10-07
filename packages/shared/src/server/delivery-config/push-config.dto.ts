import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';

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

  @ApiPropertyOptional({ description: 'Firebase 서비스 계정 이메일', example: 'firebase-adminsdk-xxx@service-factory.iam.gserviceaccount.com' })
  @IsOptional()
  @IsString()
  clientEmail?: string;

  @ApiPropertyOptional({ description: 'Firebase 서비스 계정 개인키', writeOnly: true })
  @IsOptional()
  @IsString()
  privateKey?: string;
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
