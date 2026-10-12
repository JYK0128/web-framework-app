import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { BanOperatorHandler, CreateOperatorHandler, DeleteOperatorHandler, GetOperatorByIdHandler, GetOperatorOverviewHandler, GetOperatorsHandler, ResetOperatorTwoFactorHandler, RestoreOperatorHandler, UnbanOperatorHandler, UpdateOperatorRoleHandler } from './handlers';
import { OperatorsController } from './operators.controller';

@Module({
  imports: [CqrsModule],
  controllers: [OperatorsController],
  providers: [GetOperatorByIdHandler, GetOperatorOverviewHandler, GetOperatorsHandler, CreateOperatorHandler, BanOperatorHandler, UnbanOperatorHandler, DeleteOperatorHandler, RestoreOperatorHandler, UpdateOperatorRoleHandler, ResetOperatorTwoFactorHandler],
})
export class OperatorsModule {}
