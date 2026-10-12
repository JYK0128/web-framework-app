import { Query } from '@nestjs/cqrs';
import type { EmailConfigDto } from '@pkg/shared/server';

export class GetAdminEmailDeliveryConfigQuery extends Query<EmailConfigDto> { }
