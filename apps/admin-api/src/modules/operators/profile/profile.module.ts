import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { GetOperatorByIdHandler } from '#/modules/operators/profile/get-operator-by-id.handler';
import { GetOperatorOverviewHandler } from '#/modules/operators/profile/get-operator-overview.handler';
import { GetOperatorsHandler } from '#/modules/operators/profile/get-operators.handler';
import { OperatorProfileController } from '#/modules/operators/profile/profile.controller';

@Module({ imports: [CqrsModule], controllers: [OperatorProfileController], providers: [GetOperatorByIdHandler, GetOperatorOverviewHandler, GetOperatorsHandler] })
export class OperatorProfileModule {}
