import { Module } from '@nestjs/common';

import { SupportController } from './support.controller';
import { SupportInternalController } from './support-internal.controller';
import { SupportService } from './support.service';

@Module({ controllers: [SupportController, SupportInternalController], providers: [SupportService] })
export class SupportModule {}
