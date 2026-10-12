import { Module } from '@nestjs/common';

import { TermAgreementsModule } from './agreements/agreements.module';
import { TermDocumentsModule } from './documents/documents.module';
import { TermGroupsModule } from './groups/groups.module';
import { TermRevisionsModule } from './revisions/revisions.module';

@Module({ imports: [TermAgreementsModule, TermGroupsModule, TermRevisionsModule, TermDocumentsModule] })
export class TermsModule {}
