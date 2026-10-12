import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { BanOperatorHandler } from './ban-operator.handler';
import { CreateOperatorHandler } from './create-operator.handler';
import { DeleteOperatorHandler } from './delete-operator.handler';
import { GetOperatorByIdHandler } from './get-operator-by-id.handler';
import { GetOperatorOverviewHandler } from './get-operator-overview.handler';
import { GetOperatorsHandler } from './get-operators.handler';
import { OperatorsController } from './operators.controller';
import { ResetOperatorTwoFactorHandler } from './reset-operator-two-factor.handler';
import { RestoreOperatorHandler } from './restore-operator.handler';
import { UnbanOperatorHandler } from './unban-operator.handler';
import { UpdateOperatorRoleHandler } from './update-operator-role.handler';

@Module({
  imports: [CqrsModule],
  controllers: [OperatorsController],
  providers: [GetOperatorByIdHandler, GetOperatorOverviewHandler, GetOperatorsHandler, CreateOperatorHandler, BanOperatorHandler, UnbanOperatorHandler, DeleteOperatorHandler, RestoreOperatorHandler, UpdateOperatorRoleHandler, ResetOperatorTwoFactorHandler],
})
export class OperatorsModule {}
