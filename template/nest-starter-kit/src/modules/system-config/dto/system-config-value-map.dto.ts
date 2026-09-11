import type { ClassConstructor } from 'class-transformer';

import { SystemConfigKey } from '#/entities/system-config/system-config.entity';
import { InquiryConfigDto } from '#/modules/system-config/dto/inquiry-config.dto';
import { MaintenanceConfigDto } from '#/modules/system-config/dto/maintenance-config.dto';
import { NotificationConfigDto } from '#/modules/system-config/dto/notification-config.dto';
import { OAuthConfigDto } from '#/modules/system-config/dto/oauth-config.dto';
import { OperationConfigDto } from '#/modules/system-config/dto/operation-config.dto';
import { SecurityConfigDto } from '#/modules/system-config/dto/security-config.dto';

/**
 * SystemConfigKey와 해당 설정의 Value DTO 1:1 매핑 타입
 */
export interface SystemConfigValueMap {
  operation: OperationConfigDto
  maintenance: MaintenanceConfigDto
  security: SecurityConfigDto
  inquiry: InquiryConfigDto
  notification: NotificationConfigDto
  oauth: OAuthConfigDto
}

/**
 * SystemConfigKey에 대응하는 Value DTO 클래스 매핑 객체
 */
export const SYSTEM_CONFIG_DTO_MAP: Record<SystemConfigKey, ClassConstructor<unknown>> = {
  [SystemConfigKey.OPERATION]: OperationConfigDto,
  [SystemConfigKey.MAINTENANCE]: MaintenanceConfigDto,
  [SystemConfigKey.SECURITY]: SecurityConfigDto,
  [SystemConfigKey.INQUIRY]: InquiryConfigDto,
  [SystemConfigKey.NOTIFICATION]: NotificationConfigDto,
  [SystemConfigKey.OAUTH]: OAuthConfigDto,
};
