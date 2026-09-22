export { GetServiceTermAgreementsHandler } from './get-service-term-agreements.handler';
export { GetServiceTermHandler } from './get-service-term.handler';
export { GetServiceTermsHandler } from './get-service-terms.handler';
export { SetServiceTermAgreementsHandler } from './set-service-term-agreements.handler';

import { GetServiceTermAgreementsHandler } from './get-service-term-agreements.handler';
import { GetServiceTermHandler } from './get-service-term.handler';
import { GetServiceTermsHandler } from './get-service-terms.handler';
import { SetServiceTermAgreementsHandler } from './set-service-term-agreements.handler';
export const serviceTermHandlers = [GetServiceTermsHandler, GetServiceTermHandler, GetServiceTermAgreementsHandler, SetServiceTermAgreementsHandler];
