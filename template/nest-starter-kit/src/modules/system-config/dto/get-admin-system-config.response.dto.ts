import { ApiProperty } from '@nestjs/swagger';
import { plainToInstance, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { type SystemConfig, SystemConfigKey } from '#/entities/system-config/system-config.entity';

import { InquiryConfigDto } from './inquiry-config.dto';
import { MaintenanceConfigDto } from './maintenance-config.dto';
import { NotificationConfigDto } from './notification-config.dto';
import { OAuthConfigDto, OAuthProviderDetailDto } from './oauth-config.dto';
import { OperationConfigDto } from './operation-config.dto';
import { SecurityConfigDto } from './security-config.dto';

export class GetAdminSystemConfigResponseDto {
  @ApiProperty({ type: OperationConfigDto, description: '운영 설정 (시간, 공휴일, 안내메시지)' })
  @ValidateNested()
  @Type(() => OperationConfigDto)
  operation!: OperationConfigDto;

  @ApiProperty({ type: MaintenanceConfigDto, description: '시스템 점검 설정 (임시점검, 정기점검)' })
  @ValidateNested()
  @Type(() => MaintenanceConfigDto)
  maintenance!: MaintenanceConfigDto;

  @ApiProperty({ type: SecurityConfigDto, description: '계정 및 인증 보안 정책' })
  @ValidateNested()
  @Type(() => SecurityConfigDto)
  security!: SecurityConfigDto;

  @ApiProperty({ type: InquiryConfigDto, description: '1:1 문의 정책 및 알림 연동' })
  @ValidateNested()
  @Type(() => InquiryConfigDto)
  inquiry!: InquiryConfigDto;

  @ApiProperty({ type: NotificationConfigDto, description: '대고객 알림 발송 설정 (이메일, 카카오톡, SMS, 푸시)' })
  @ValidateNested()
  @Type(() => NotificationConfigDto)
  notification!: NotificationConfigDto;

  @ApiProperty({ type: OAuthConfigDto, description: 'OAuth 소셜 로그인 설정 (Google, Kakao, Naver)' })
  @ValidateNested()
  @Type(() => OAuthConfigDto)
  oauth!: OAuthConfigDto;

  constructor(configs: Array<Pick<SystemConfig, 'key' | 'value'>> = []) {
    const map = new Map(configs.map((config) => [config.key, config.value]));
    this.operation = plainToInstance(OperationConfigDto, map.get(SystemConfigKey.OPERATION) ?? {});
    this.maintenance = plainToInstance(MaintenanceConfigDto, map.get(SystemConfigKey.MAINTENANCE) ?? {});
    this.security = plainToInstance(SecurityConfigDto, map.get(SystemConfigKey.SECURITY) ?? {});
    this.inquiry = plainToInstance(InquiryConfigDto, map.get(SystemConfigKey.INQUIRY) ?? {});
    this.notification = plainToInstance(NotificationConfigDto, map.get(SystemConfigKey.NOTIFICATION) ?? {});

    const rawOAuth = map.get(SystemConfigKey.OAUTH) ?? {};
    const providerEntries = Object.entries(rawOAuth).filter(
      (entry): entry is [string, Record<string, unknown>] => {
        const value = entry[1];
        return Boolean(value && typeof value === 'object' && !Array.isArray(value));
      },
    );
    this.oauth = plainToInstance(
      OAuthConfigDto,
      Object.fromEntries(
        providerEntries.map(([key, value]) => [key, plainToInstance(OAuthProviderDetailDto, value)]),
      ),
    );
  }
}
