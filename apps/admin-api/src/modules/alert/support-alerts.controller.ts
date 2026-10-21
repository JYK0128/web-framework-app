import { Controller, type MessageEvent, Sse } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions, UserAuth } from '@pkg/server-core/http/decorators';
import { RealtimeService } from '@pkg/server-core/realtime';
import { AdminPermission } from '@pkg/shared';
import type { Observable } from 'rxjs';

import { SUPPORT_UNANSWERED_ALERT_TOPIC } from '~/modules/alert/alerts.constants';

@ApiTags('support')
@UserAuth()
@Controller('support')
export class SupportAlertsController {
  constructor(private readonly realtime: RealtimeService) {}

  @ApiOperation({ summary: undefined, operationId: 'SupportController_notifications_v1' })
  @Sse('notifications/events') @Permissions(AdminPermission.support.read)
  notifications(): Observable<MessageEvent> {
    return this.realtime.streamSSE(SUPPORT_UNANSWERED_ALERT_TOPIC);
  }
}
