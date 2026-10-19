import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { GetLogStatsHandler } from './handlers/get-log-stats.handler';
import { GetLogsHandler } from './handlers/get-logs.handler';
import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';

@Module({ imports: [CqrsModule], controllers: [LogsController], providers: [LogsService, GetLogsHandler, GetLogStatsHandler], exports: [LogsService] })
export class LogsModule {}
