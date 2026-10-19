import { Module } from '@nestjs/common';

import { TermAgreementsModule } from '#/modules/term/agreement/agreements.module';
import { TermDocumentsModule } from '#/modules/term/document/documents.module';
import { TermGroupsModule } from '#/modules/term/group/groups.module';
import { TermRevisionsModule } from '#/modules/term/revision/revisions.module';

@Module({ imports: [TermAgreementsModule, TermGroupsModule, TermRevisionsModule, TermDocumentsModule] })
export class TermsModule {}
