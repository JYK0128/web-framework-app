import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { LOG_QUERY_HANDLERS } from './handlers';
import { LogsController } from './logs.controller';

@Module({
  imports: [CqrsModule],
  controllers: [LogsController],
  providers: [
    ...LOG_QUERY_HANDLERS,
  ],
})
export class LogsModule {}
