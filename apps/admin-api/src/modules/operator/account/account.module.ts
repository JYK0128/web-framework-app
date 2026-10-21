import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { OperatorAccountController } from '~/modules/operator/account/account.controller';
import { CreateOperatorHandler } from '~/modules/operator/account/create-operator.handler';
import { DeleteOperatorHandler } from '~/modules/operator/account/delete-operator.handler';
import { RestoreOperatorHandler } from '~/modules/operator/account/restore-operator.handler';

@Module({ imports: [CqrsModule], controllers: [OperatorAccountController], providers: [CreateOperatorHandler, DeleteOperatorHandler, RestoreOperatorHandler] })
export class OperatorAccountModule {}
