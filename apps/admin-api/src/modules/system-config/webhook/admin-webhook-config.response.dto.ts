import { HttpStatus } from '@nestjs/common';

import { WebhookConfigDto } from '~/modules/system-config/webhook/webhook-config.dto';

export class AdminWebhookConfigResponseDto extends WebhookConfigDto {
  protected static override readonly validationError = {
    code: 'VALIDATION_ERROR',
    status: HttpStatus.SERVICE_UNAVAILABLE,
  };
}
