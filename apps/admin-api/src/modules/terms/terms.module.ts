import { Module } from '@nestjs/common';

import { TermAgreementsModule } from '#/modules/terms/agreements/agreements.module';
import { TermDocumentsModule } from '#/modules/terms/documents/documents.module';
import { TermGroupsModule } from '#/modules/terms/groups/groups.module';
import { TermRevisionsModule } from '#/modules/terms/revisions/revisions.module';

@Module({ imports: [TermAgreementsModule, TermGroupsModule, TermRevisionsModule, TermDocumentsModule] })
export class TermsModule {}
