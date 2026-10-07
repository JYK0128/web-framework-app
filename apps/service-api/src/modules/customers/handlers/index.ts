import { GetCustomerByIdHandler } from './get-customer-by-id.handler';
import { GetCustomersHandler } from './get-customers.handler';

export { GetCustomerByIdHandler } from './get-customer-by-id.handler';
export { GetCustomersHandler } from './get-customers.handler';

export const customerHandlers = [GetCustomerByIdHandler, GetCustomersHandler];
