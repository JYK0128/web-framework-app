import { Module } from '@nestjs/common';

import { ServiceTermDocumentsModule } from './documents/documents.module';
import { ServiceTermGroupsModule } from './groups/groups.module';
import { ServiceTermRevisionsModule } from './revisions/revisions.module';

@Module({ imports: [ServiceTermDocumentsModule, ServiceTermGroupsModule, ServiceTermRevisionsModule] })
export class ServiceTermsModule {}
