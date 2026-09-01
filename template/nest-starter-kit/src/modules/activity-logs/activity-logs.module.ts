import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { ActivityLogsController } from './activity-logs.controller';
import { ActivityLogsQueryHandlers } from './handlers';

@Module({
  imports: [CqrsModule],
  controllers: [ActivityLogsController],
  providers: [
    ...ActivityLogsQueryHandlers,
  ],
})
export class ActivityLogsModule {}
