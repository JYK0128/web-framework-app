import { Module } from '@nestjs/common';

import { OperatorAccessModule } from '#/modules/operators/access/access.module';
import { OperatorAccountModule } from '#/modules/operators/account/account.module';
import { OperatorProfileModule } from '#/modules/operators/profile/profile.module';

@Module({ imports: [OperatorProfileModule, OperatorAccountModule, OperatorAccessModule] })
export class OperatorsModule {}
