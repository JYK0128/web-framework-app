import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { ActivityLogsController } from './activity-logs.controller';
import { ActivityLogsQueryHandlers } from './handlers';
import { LokiLogReaderService } from './services/loki-log-reader.service';

@Module({
  imports: [CqrsModule],
  controllers: [ActivityLogsController],
  providers: [
    LokiLogReaderService,
    ...ActivityLogsQueryHandlers,
  ],
  exports: [LokiLogReaderService],
})
export class ActivityLogsModule {}
