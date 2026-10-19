import { Module } from '@nestjs/common';

import { ServiceTermAgreementsModule } from '#/modules/service-term/agreement/agreements.module';
import { ServiceTermDocumentsModule } from '#/modules/service-term/document/documents.module';
import { ServiceTermGroupsModule } from '#/modules/service-term/group/groups.module';
import { ServiceTermRevisionsModule } from '#/modules/service-term/revision/revisions.module';

@Module({
  imports: [ServiceTermGroupsModule, ServiceTermRevisionsModule, ServiceTermAgreementsModule, ServiceTermDocumentsModule],
})
export class ServiceTermsModule {}
