import { Module } from '@nestjs/common';

import { OperatorAccessModule } from '#/modules/operator/access/access.module';
import { OperatorAccountModule } from '#/modules/operator/account/account.module';
import { OperatorProfileModule } from '#/modules/operator/profile/profile.module';

@Module({ imports: [OperatorProfileModule, OperatorAccountModule, OperatorAccessModule] })
export class OperatorsModule {}
