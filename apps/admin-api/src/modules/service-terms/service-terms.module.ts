import { Module } from '@nestjs/common';

import { ServiceTermDocumentsModule } from '#/modules/service-terms/documents/documents.module';
import { ServiceTermGroupsModule } from '#/modules/service-terms/groups/groups.module';
import { ServiceTermRevisionsModule } from '#/modules/service-terms/revisions/revisions.module';

@Module({ imports: [ServiceTermDocumentsModule, ServiceTermGroupsModule, ServiceTermRevisionsModule] })
export class ServiceTermsModule {}
