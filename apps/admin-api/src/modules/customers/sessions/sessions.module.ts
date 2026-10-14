import { Module } from '@nestjs/common';

import { CustomerSessionsController } from '#/modules/customers/sessions/sessions.controller';

@Module({ controllers: [CustomerSessionsController] })
export class CustomerSessionsModule {}
