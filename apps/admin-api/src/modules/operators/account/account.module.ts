import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { OperatorAccountController } from '#/modules/operators/account/account.controller';
import { CreateOperatorHandler } from '#/modules/operators/account/create-operator.handler';
import { DeleteOperatorHandler } from '#/modules/operators/account/delete-operator.handler';
import { RestoreOperatorHandler } from '#/modules/operators/account/restore-operator.handler';

@Module({ imports: [CqrsModule], controllers: [OperatorAccountController], providers: [CreateOperatorHandler, DeleteOperatorHandler, RestoreOperatorHandler] })
export class OperatorAccountModule {}
