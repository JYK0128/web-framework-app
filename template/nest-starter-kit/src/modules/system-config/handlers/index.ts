import { GetAdminSystemConfigHandler } from './get-admin-system-config.handler';
import { GetHolidaysHandler } from './get-holidays.handler';
import { GetSystemConfigHandler } from './get-system-config.handler';
import { UpdateInquiryTabHandler } from './update-inquiry-tab.handler';
import { UpdateMaintenanceTabHandler } from './update-maintenance-tab.handler';
import { UpdateOperationsTabHandler } from './update-operations-tab.handler';
import { UpdateSecurityTabHandler } from './update-security-tab.handler';

export * from './get-admin-system-config.handler';
export * from './get-holidays.handler';
export * from './get-system-config.handler';
export * from './update-inquiry-tab.handler';
export * from './update-maintenance-tab.handler';
export * from './update-operations-tab.handler';
export * from './update-security-tab.handler';

export const SYSTEM_CONFIG_HANDLERS = [
  GetSystemConfigHandler,
  GetAdminSystemConfigHandler,
  GetHolidaysHandler,
  UpdateOperationsTabHandler,
  UpdateMaintenanceTabHandler,
  UpdateSecurityTabHandler,
  UpdateInquiryTabHandler,
];
