import { Controller, type MessageEvent, Sse } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { UserAuth } from '@pkg/server-core/http/decorators/auth-mode.decorator';
import { Permissions } from '@pkg/server-core/http/decorators/permission.decorator';
import { RealtimeService } from '@pkg/server-core/realtime/realtime.service';
import { AdminPermission } from '@pkg/shared';
import type { Observable } from 'rxjs';

import { QNA_CREATED_ALERT_TOPIC } from '#/modules/alert/alerts.constants';

@ApiTags('qna')
@UserAuth()
@Controller('qna')
export class QnaAlertsController {
  constructor(private readonly realtime: RealtimeService) {}

  @Sse('notifications/events')
  @Permissions(AdminPermission.qna.read)
  @ApiExcludeEndpoint()
  notifications(): Observable<MessageEvent> {
    return this.realtime.streamSSE(QNA_CREATED_ALERT_TOPIC);
  }
}
