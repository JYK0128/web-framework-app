import { Module } from '@nestjs/common';

import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';
import { GetLogsHandler } from './handlers/get-logs.handler';
import { GetLogStatsHandler } from './handlers/get-log-stats.handler';
import { CqrsModule } from '@nestjs/cqrs';

@Module({ imports: [CqrsModule], controllers: [LogsController], providers: [LogsService, GetLogsHandler, GetLogStatsHandler], exports: [LogsService] })
export class LogsModule {}
