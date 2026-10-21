import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { OperatorAccessController } from '~/modules/operator/access/access.controller';
import { BanOperatorHandler } from '~/modules/operator/access/ban-operator.handler';
import { ResetOperatorTwoFactorHandler } from '~/modules/operator/access/reset-operator-two-factor.handler';
import { UnbanOperatorHandler } from '~/modules/operator/access/unban-operator.handler';
import { UpdateOperatorRoleHandler } from '~/modules/operator/access/update-operator-role.handler';

@Module({ imports: [CqrsModule], controllers: [OperatorAccessController], providers: [BanOperatorHandler, ResetOperatorTwoFactorHandler, UnbanOperatorHandler, UpdateOperatorRoleHandler] })
export class OperatorAccessModule {}
