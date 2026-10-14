import { Module } from '@nestjs/common';

import { CustomerProfileController } from '#/modules/customers/profile/profile.controller';

@Module({ controllers: [CustomerProfileController] })
export class CustomerProfileModule {}
