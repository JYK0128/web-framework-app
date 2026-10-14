import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Interval } from '@nestjs/schedule';
import { TimeUtil } from '@pkg/shared/common';

import { SERVICE_RUNTIME_CONFIG } from '#/app.config';
import { AutoCloseSupportRoomsCommand } from '#/modules/support/notification/auto-close-support-rooms.command';
import { CheckUnansweredSupportRoomsCommand } from '#/modules/support/notification/check-unanswered-support-rooms.command';

@Injectable()
export class SupportInquiryScheduler {
  constructor(private readonly commandBus: CommandBus) {}
  @Interval(TimeUtil.ms.minute(SERVICE_RUNTIME_CONFIG.support.unansweredCheckIntervalMinutes))
  async checkUnansweredRooms(): Promise<void> {
    await this.commandBus.execute(new CheckUnansweredSupportRoomsCommand({}));
  }

  @Interval(TimeUtil.ms.minute(SERVICE_RUNTIME_CONFIG.support.autoCloseCheckIntervalMinutes))
  async autoCloseAnsweredRooms(): Promise<void> {
    await this.commandBus.execute(new AutoCloseSupportRoomsCommand({}));
  }
}
