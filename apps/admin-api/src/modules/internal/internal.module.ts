import { Module } from '@nestjs/common';

import { InternalConfigsController } from './internal-configs.controller';

@Module({
  controllers: [InternalConfigsController],
})
export class InternalModule {}
