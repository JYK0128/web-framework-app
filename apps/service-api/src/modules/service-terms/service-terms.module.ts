import { Module } from '@nestjs/common';

import { ServiceTermAgreementsModule } from '#/modules/service-terms/agreements/agreements.module';
import { ServiceTermDocumentsModule } from '#/modules/service-terms/documents/documents.module';
import { ServiceTermGroupsModule } from '#/modules/service-terms/groups/groups.module';
import { ServiceTermRevisionsModule } from '#/modules/service-terms/revisions/revisions.module';

@Module({
  imports: [ServiceTermGroupsModule, ServiceTermRevisionsModule, ServiceTermAgreementsModule, ServiceTermDocumentsModule],
})
export class ServiceTermsModule {}
