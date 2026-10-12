import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { GetLogStatsHandler } from './get-log-stats.handler';
import { GetLogsHandler } from './get-logs.handler';
import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';

@Module({ imports: [CqrsModule], controllers: [LogsController], providers: [LogsService, GetLogsHandler, GetLogStatsHandler], exports: [LogsService] })
export class LogsModule {}
