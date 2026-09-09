import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { LOG_QUERY_HANDLERS } from './handlers';
import { LogManagementController } from './log-management.controller';

@Module({
  imports: [CqrsModule],
  controllers: [LogManagementController],
  providers: [
    ...LOG_QUERY_HANDLERS,
  ],
})
export class LogManagementModule {}
