import { Module } from '@nestjs/common';

import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { SupportInternalController } from './support-internal.controller';

@Module({ controllers: [SupportController, SupportInternalController], providers: [SupportService] })
export class SupportModule {}
