import { Controller, type MessageEvent, Sse } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { PrincipalContext } from '@pkg/server-core/http/contexts/principal.context';
import { UserAuth } from '@pkg/server-core/http/decorators/auth-mode.decorator';
import { Permissions } from '@pkg/server-core/http/decorators/permission.decorator';
import { ServicePermission } from '@pkg/shared';
import type { Observable } from 'rxjs';

import { NotificationStreamService } from '#/modules/notification/notification-stream.service';

@ApiTags('notifications') @UserAuth() @Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly principalContext: PrincipalContext,
    private readonly notificationStream: NotificationStreamService,
  ) {}

  @Sse('events') @Permissions(ServicePermission.notification.read) @ApiExcludeEndpoint()
  events(): Observable<MessageEvent> {
    const user = this.principalContext.ensureUser();
    return this.notificationStream.stream(user.id, user.permissions);
  }
}
