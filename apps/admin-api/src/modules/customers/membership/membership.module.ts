import { Module } from '@nestjs/common';

import { CustomerMembershipController } from '#/modules/customers/membership/membership.controller';

@Module({ controllers: [CustomerMembershipController] })
export class CustomerMembershipModule {}
