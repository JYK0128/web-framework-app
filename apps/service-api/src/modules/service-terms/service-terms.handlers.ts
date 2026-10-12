import { GetServiceAgreementHistoryHandler } from './agreements/get-service-agreement-history.handler';
import { GetServiceTermAgreementsHandler } from './agreements/get-service-term-agreements.handler';
import { SetServiceTermAgreementsHandler } from './agreements/set-service-term-agreements.handler';
import { GetServiceTermHandler } from './get-service-term.handler';
import { GetServiceTermsHandler } from './get-service-terms.handler';
import { GetTermRevisionsHandler } from './revisions/get-term-revisions.handler';

export const serviceTermHandlers = [GetTermRevisionsHandler, GetServiceAgreementHistoryHandler, GetServiceTermsHandler, GetServiceTermHandler, GetServiceTermAgreementsHandler, SetServiceTermAgreementsHandler];
