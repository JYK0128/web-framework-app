import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { GetLogStatsHandler } from '~/modules/log/get-log-stats.handler';
import { GetLogsHandler } from '~/modules/log/get-logs.handler';
import { LogsController } from '~/modules/log/logs.controller';

@Module({ imports: [CqrsModule], controllers: [LogsController], providers: [GetLogsHandler, GetLogStatsHandler] })
export class LogsModule {}
