import { Module } from '@nestjs/common';

import { ServiceTermDocumentsModule } from '#/modules/service-term/document/documents.module';
import { ServiceTermGroupsModule } from '#/modules/service-term/group/groups.module';
import { ServiceTermRevisionsModule } from '#/modules/service-term/revision/revisions.module';

@Module({ imports: [ServiceTermDocumentsModule, ServiceTermGroupsModule, ServiceTermRevisionsModule] })
export class ServiceTermsModule {}
