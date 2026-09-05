import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { UpdateInquiryTabCommand } from '#/modules/system-config/commands/update-inquiry-tab.command';
import { UpdateInquiryTabResponseDto } from '#/modules/system-config/dto';
import { SystemConfigTabUpdateService } from '#/modules/system-config/services/system-config-tab-update.service';

@CommandHandler(UpdateInquiryTabCommand)
export class UpdateInquiryTabHandler implements ICommandHandler<UpdateInquiryTabCommand, UpdateInquiryTabResponseDto> {
  constructor(
    private readonly updater: SystemConfigTabUpdateService,
  ) {}

  async execute(command: UpdateInquiryTabCommand): Promise<UpdateInquiryTabResponseDto> {
    await this.updater.update(
      ['inquiry'],
      (configMap) => {
        configMap.get('inquiry')!.value = {
          unansweredThresholdMinutes: command.input.inquiry.unansweredThresholdMinutes,
          autoCloseHours: command.input.inquiry.autoCloseHours,
          notification: {
            enabled: Boolean(command.input.inquiry.notification.enabled),
            type: command.input.inquiry.notification.type,
            webhookUrl: command.input.inquiry.notification.webhookUrl,
          },
        };
      },
      command.adminUser.id,
    );
    return { ok: true };
  }
}
