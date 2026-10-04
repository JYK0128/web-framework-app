import { ApiSchema } from '@nestjs/swagger';

import { DeleteSupportTicketResponseDto } from './delete-support-ticket.response.dto';

@ApiSchema({ name: 'DeleteAdminSupportTicketResponseDto' })
export class DeleteAdminSupportTicketResponseDto extends DeleteSupportTicketResponseDto {}
