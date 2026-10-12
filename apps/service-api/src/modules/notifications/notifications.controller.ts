import { Controller, type MessageEvent, Sse } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import type { Observable } from 'rxjs';

import { PrincipalContext } from '#/core/http/contexts/principal.context';
import { UserAuth } from '#/core/http/decorators/auth-mode.decorator';

import { NotificationStreamService } from './notification-stream.service';

@ApiTags('notifications') @UserAuth() @Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly principalContext: PrincipalContext,
    private readonly notificationStream: NotificationStreamService,
  ) {}

  @Sse('events') @ApiExcludeEndpoint()
  events(): Observable<MessageEvent> {
    const user = this.principalContext.ensureUser();
    return this.notificationStream.stream(user.id);
  }
}
