import { Module } from '@nestjs/common';

import { CustomerProfileController } from '~/modules/customer/profile/profile.controller';

@Module({ controllers: [CustomerProfileController] })
export class CustomerProfileModule {}
