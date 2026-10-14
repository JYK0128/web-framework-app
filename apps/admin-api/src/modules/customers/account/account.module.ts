import { Module } from '@nestjs/common';

import { CustomerAccountController } from '#/modules/customers/account/account.controller';

@Module({ controllers: [CustomerAccountController] })
export class CustomerAccountModule {}
