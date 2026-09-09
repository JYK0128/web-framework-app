import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';

import { EntityDto } from '#/common/dto/entity-dto';
import { SystemConfig } from '#/entities/system-config/system-config.entity';

import { InquiryConfigDto } from './inquiry-config.dto';
import { MaintenanceConfigDto } from './maintenance-config.dto';
import { NotificationConfigDto } from './notification-config.dto';
import { OAuthConfigDto } from './oauth-config.dto';
import { OperatingHolidayItemDto } from './operating-holiday-item.dto';
import { OperatingLunchBreakDto, OperatingMessagesDto } from './operating-hours.dto';
import { SecurityConfigDto } from './security-config.dto';

export class OperatingHoursUpdateDto {
  @ApiPropertyOptional({ example: '09:00' })
  @IsOptional()
  start?: string;

  @ApiPropertyOptional({ example: '18:00' })
  @IsOptional()
  end?: string;

  @ApiPropertyOptional({ type: [Number], example: [1, 2, 3, 4, 5] })
  @IsOptional()
  openDays?: number[];

  @ApiPropertyOptional({ type: OperatingLunchBreakDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => OperatingLunchBreakDto)
  lunchBreak?: OperatingLunchBreakDto;
}

export class UpdateOperationsDto {
  @ApiPropertyOptional({ type: OperatingHoursUpdateDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => OperatingHoursUpdateDto)
  hours?: OperatingHoursUpdateDto;

  @ApiPropertyOptional({ type: [OperatingHolidayItemDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => OperatingHolidayItemDto)
  holidays?: OperatingHolidayItemDto[];

  @ApiPropertyOptional({ type: OperatingMessagesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => OperatingMessagesDto)
  messages?: OperatingMessagesDto;
}

export class UpdateSystemConfigRequestDto extends EntityDto(SystemConfig) {
  @ApiPropertyOptional({ type: UpdateOperationsDto, description: '운영 설정 (시간, 공휴일, 안내메시지)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateOperationsDto)
  operation?: UpdateOperationsDto;

  @ApiPropertyOptional({ type: MaintenanceConfigDto, description: '시스템 점검 설정' })
  @IsOptional()
  @ValidateNested()
  @Type(() => MaintenanceConfigDto)
  maintenance?: MaintenanceConfigDto;

  @ApiPropertyOptional({ type: SecurityConfigDto, description: '보안 정책 설정' })
  @IsOptional()
  @ValidateNested()
  @Type(() => SecurityConfigDto)
  security?: SecurityConfigDto;

  @ApiPropertyOptional({ type: InquiryConfigDto, description: '1:1 문의 정책 및 알림 연동' })
  @IsOptional()
  @ValidateNested()
  @Type(() => InquiryConfigDto)
  inquiry?: InquiryConfigDto;

  @ApiPropertyOptional({ type: NotificationConfigDto, description: '대고객 알림 발송 설정 (이메일, 카카오톡, SMS, 푸시)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationConfigDto)
  notification?: NotificationConfigDto;

  @ApiPropertyOptional({ type: OAuthConfigDto, description: 'OAuth 소셜 로그인 설정 (Google, Kakao, Naver)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => OAuthConfigDto)
  oauth?: OAuthConfigDto;
}
