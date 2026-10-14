import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { OperatorAccessController } from '#/modules/operators/access/access.controller';
import { BanOperatorHandler } from '#/modules/operators/access/ban-operator.handler';
import { ResetOperatorTwoFactorHandler } from '#/modules/operators/access/reset-operator-two-factor.handler';
import { UnbanOperatorHandler } from '#/modules/operators/access/unban-operator.handler';
import { UpdateOperatorRoleHandler } from '#/modules/operators/access/update-operator-role.handler';

@Module({ imports: [CqrsModule], controllers: [OperatorAccessController], providers: [BanOperatorHandler, ResetOperatorTwoFactorHandler, UnbanOperatorHandler, UpdateOperatorRoleHandler] })
export class OperatorAccessModule {}
