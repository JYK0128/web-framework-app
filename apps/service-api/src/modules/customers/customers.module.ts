import { Module } from '@nestjs/common';

import { CustomerAccountModule } from '#/modules/customers/account/account.module';
import { CustomerMembershipModule } from '#/modules/customers/membership/membership.module';
import { CustomerProfileModule } from '#/modules/customers/profile/profile.module';
import { CustomerSessionsModule } from '#/modules/customers/sessions/sessions.module';

@Module({
  imports: [CustomerAccountModule, CustomerMembershipModule, CustomerSessionsModule, CustomerProfileModule],
})
export class CustomersModule {}
