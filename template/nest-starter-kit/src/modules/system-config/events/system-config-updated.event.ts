import type { IEvent } from '@nestjs/cqrs';

import type { SystemConfigKey } from '#/entities/system-config/system-config.entity';

export class SystemConfigUpdatedEvent implements IEvent {
  constructor(
    public readonly keys: readonly SystemConfigKey[],
    public readonly updatedBy?: string,
    public readonly timestamp: number = Date.now(),
  ) {}
}
