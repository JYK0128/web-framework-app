import { Module } from '@nestjs/common';

import { CustomerMembershipController } from '~/modules/customer/membership/membership.controller';

@Module({ controllers: [CustomerMembershipController] })
export class CustomerMembershipModule {}
