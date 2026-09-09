import { GetLogByIdHandler } from './get-log-by-id.handler';
import { GetLogStatsHandler } from './get-log-stats.handler';
import { GetLogsHandler } from './get-logs.handler';

export { GetLogByIdHandler,
  GetLogsHandler,
  GetLogStatsHandler };

export const LOG_QUERY_HANDLERS = [
  GetLogsHandler,
  GetLogByIdHandler,
  GetLogStatsHandler,
];
