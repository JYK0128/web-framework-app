import type { InquiryConfigDto } from './inquiry-config.dto';
import type { MaintenanceConfigDto } from './maintenance-config.dto';
import type { OperationConfigDto } from './operation-config.dto';
import type { SecurityConfigDto } from './security-config.dto';

/**
 * SystemConfigKey와 해당 설정의 Value DTO 1:1 매핑 타입
 */
export interface SystemConfigValueMap {
  operation: OperationConfigDto
  maintenance: MaintenanceConfigDto
  security: SecurityConfigDto
  inquiry: InquiryConfigDto
}
