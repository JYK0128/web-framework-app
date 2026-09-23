export { GetFaqHandler } from './get-faq.handler';
export { GetFaqsHandler } from './get-faqs.handler';
export { GetInternalFaqsHandler } from './get-internal-faqs.handler';
export { CreateFaqHandler, DeleteFaqHandler, UpdateFaqHandler } from './internal-faq-actions.handler';

import { GetFaqHandler } from './get-faq.handler';
import { GetFaqsHandler } from './get-faqs.handler';

export const faqHandlers = [GetFaqHandler, GetFaqsHandler];
