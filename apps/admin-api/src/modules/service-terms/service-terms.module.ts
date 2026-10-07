import { Module } from '@nestjs/common';

import { ServiceTermsController } from './service-terms.controller';

@Module({ controllers: [ServiceTermsController] })
export class ServiceTermsModule {}
