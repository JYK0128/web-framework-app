import { GetAdminSystemConfigHandler } from './get-admin-system-config.handler';
import { GetHolidaysHandler } from './get-holidays.handler';
import { GetSystemConfigHandler } from './get-system-config.handler';
import { UpdateSystemConfigHandler } from './update-system-config.handler';

export * from './get-admin-system-config.handler';
export * from './get-holidays.handler';
export * from './get-system-config.handler';
export * from './update-system-config.handler';

export const SYSTEM_CONFIG_HANDLERS = [
  GetSystemConfigHandler,
  GetAdminSystemConfigHandler,
  GetHolidaysHandler,
  UpdateSystemConfigHandler,
];
