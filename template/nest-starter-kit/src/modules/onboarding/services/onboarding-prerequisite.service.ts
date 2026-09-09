import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

import { SystemContext } from '#/common/contexts/system.context';
import { MessageChannel, MessageTemplate } from '#/entities/templates/message-template.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { NotificationConfigDto } from '#/modules/system-config/dto/notification-config.dto';

@Injectable()
export class OnboardingPrerequisiteService {
  constructor(
    private readonly em: AppEntityManager,
    private readonly systemContext: SystemContext,
  ) {}

  async ensureEmailVerification(): Promise<void> {
    const config = await this.systemContext.getConfig<NotificationConfigDto>('notification');
    const smtp = config?.email?.smtp;
    if (!smtp?.host || !smtp?.port || !smtp?.user || !smtp?.pass || !config?.email?.from) {
      throw new ApplicationError({
        code: 'ONBOARDING_NOT_CONFIGURED',
        status: HttpStatus.SERVICE_UNAVAILABLE,
      });
    }

    const template = await this.em.findOne(
      MessageTemplate,
      { code: 'AUTH_VERIFY_EMAIL', isActive: true },
      { populate: ['channels'] },
    );
    const emailChannel = template?.channels.getItems().find((channel) =>
      channel.channel === MessageChannel.EMAIL && channel.isActive && Boolean(channel.body));
    if (!emailChannel) {
      throw new ApplicationError({
        code: 'ONBOARDING_NOT_CONFIGURED',
        status: HttpStatus.SERVICE_UNAVAILABLE,
      });
    }
  }
}
