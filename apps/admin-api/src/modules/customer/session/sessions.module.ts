import { Module } from '@nestjs/common';

import { CustomerSessionsController } from '#/modules/customer/session/sessions.controller';

@Module({ controllers: [CustomerSessionsController] })
export class CustomerSessionsModule {}
