import { Command } from '@nestjs/cqrs';

import type { SyncAnalyticsConsentRequestDto } from '#/modules/auth/dto/sync-analytics-consent.request.dto';
import type { SyncAnalyticsConsentResponseDto } from '#/modules/auth/dto/sync-analytics-consent.response.dto';

export class SyncAnalyticsConsentCommand extends Command<SyncAnalyticsConsentResponseDto> {
  constructor(public readonly input: SyncAnalyticsConsentRequestDto = {}) {
    super();
  }
}
