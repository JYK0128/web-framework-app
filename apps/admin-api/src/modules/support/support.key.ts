import { createHash } from 'node:crypto';

import { SERVICE_ID } from '#/app.config';

export const SupportKvStoreKey = {
  socketTicket: (ticket: string) => `${SERVICE_ID}:support_socket_ticket:${createHash('sha256').update(ticket).digest('hex')}`,
} as const;
