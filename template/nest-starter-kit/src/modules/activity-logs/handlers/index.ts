import { GetActivityLogByIdHandler } from './get-activity-log-by-id.handler';
import { GetActivityLogsHandler } from './get-activity-logs.handler';
import { GetActivityStatsHandler } from './get-activity-stats.handler';

export { GetActivityLogByIdHandler,
  GetActivityLogsHandler,
  GetActivityStatsHandler };

export const ActivityLogsQueryHandlers = [
  GetActivityLogsHandler,
  GetActivityStatsHandler,
  GetActivityLogByIdHandler,
];
