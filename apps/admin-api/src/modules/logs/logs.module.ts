import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { GetLogStatsHandler } from '#/modules/logs/get-log-stats.handler';
import { GetLogsHandler } from '#/modules/logs/get-logs.handler';
import { LogsController } from '#/modules/logs/logs.controller';

@Module({ imports: [CqrsModule], controllers: [LogsController], providers: [GetLogsHandler, GetLogStatsHandler] })
export class LogsModule {}
