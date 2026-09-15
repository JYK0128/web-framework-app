import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CreateSupportTicketHandler } from './handlers/create-support-ticket.handler';
import { DeleteAdminSupportTicketHandler } from './handlers/delete-admin-support-ticket.handler';
import { DeleteSupportTicketHandler } from './handlers/delete-support-ticket.handler';
import { GetAdminSupportTicketHandler } from './handlers/get-admin-support-ticket.handler';
import { GetAdminSupportTicketsHandler } from './handlers/get-admin-support-tickets.handler';
import { GetSupportTicketHandler } from './handlers/get-support-ticket.handler';
import { GetSupportTicketsHandler } from './handlers/get-support-tickets.handler';
import { UpdateAdminSupportTicketHandler } from './handlers/update-admin-support-ticket.handler';
import { UpdateSupportTicketHandler } from './handlers/update-support-ticket.handler';
import { SupportController } from './support.controller';

const Handlers = [
  CreateSupportTicketHandler,
  UpdateSupportTicketHandler,
  UpdateAdminSupportTicketHandler,
  DeleteSupportTicketHandler,
  DeleteAdminSupportTicketHandler,
  GetSupportTicketsHandler,
  GetSupportTicketHandler,
  GetAdminSupportTicketsHandler,
  GetAdminSupportTicketHandler,
];

@Module({
  imports: [CqrsModule],
  controllers: [SupportController],
  providers: Handlers,
})
export class SupportModule {}
