import { Module } from '@nestjs/common';

import { MachineModule } from '#/modules/machine/machine.module';

import { CustomersController } from './customers.controller';

@Module({
  imports: [MachineModule],
  controllers: [CustomersController],
})
export class CustomersModule {}
