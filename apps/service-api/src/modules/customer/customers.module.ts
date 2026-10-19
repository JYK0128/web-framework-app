import { Module } from '@nestjs/common';

import { CustomerAccountModule } from '#/modules/customer/account/account.module';
import { CustomerMembershipModule } from '#/modules/customer/membership/membership.module';
import { CustomerProfileModule } from '#/modules/customer/profile/profile.module';
import { CustomerSessionsModule } from '#/modules/customer/session/sessions.module';

@Module({
  imports: [CustomerAccountModule, CustomerMembershipModule, CustomerSessionsModule, CustomerProfileModule],
})
export class CustomersModule {}
