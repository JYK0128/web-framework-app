import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { KvStore } from '@pkg/server-core/kv-store';
import { WebhookService } from '@pkg/server-core/webhook';
import { uuid } from '@pkg/shared/common';

import { SystemContext } from '~/core/system.context';
import { AdminWebhookConfigResponseDto } from '~/modules/system-config/webhook/admin-webhook-config.response.dto';
import { SendWebhookCommand } from '~/modules/webhook/send-webhook.command';
import { SendWebhookResponseDto } from '~/modules/webhook/send-webhook.response.dto';

@Injectable()
@CommandHandler(SendWebhookCommand)
export class SendWebhookHandler implements ICommandHandler<SendWebhookCommand, SendWebhookResponseDto> {
  private readonly logger = new Logger(SendWebhookHandler.name);

  constructor(
    private readonly systemContext: SystemContext,
    private readonly kvStore: KvStore,
    private readonly webhooks: WebhookService,
  ) {}

  async execute({ input }: SendWebhookCommand): Promise<SendWebhookResponseDto> {
    const { webhook: configuredWebhook } = await this.systemContext.getConfig();
    const webhook = AdminWebhookConfigResponseDto.parse(configuredWebhook).validate();
    const cooldown = await this.acquireCooldown(input.cooldownKey, webhook.cooldownMinutes);
    if (!cooldown.accepted) return SendWebhookResponseDto.parse({ accepted: false, sent: false });

    if (!webhook.enabled || !webhook.webhookUrl.trim()) {
      return SendWebhookResponseDto.parse({ accepted: true, sent: false });
    }

    return this.send(input, webhook, cooldown.key, cooldown.token);
  }

  private async acquireCooldown(
    key: string | undefined,
    cooldownMinutes: number,
  ): Promise<{ accepted: false } | { accepted: true, key?: string, token?: string }> {
    if (!key) return { accepted: true };

    const cooldownKey = `admin:webhook:cooldown:${key}`;
    const token = uuid();
    const accepted = await this.kvStore.setIfAbsent(cooldownKey, token, cooldownMinutes * 60);
    return accepted ? { accepted: true, key: cooldownKey, token } : { accepted: false };
  }

  private async send(
    input: SendWebhookCommand['input'],
    webhook: AdminWebhookConfigResponseDto,
    cooldownKey: string | undefined,
    cooldownToken: string | undefined,
  ): Promise<SendWebhookResponseDto> {
    try {
      await this.webhooks.send({
        type: webhook.type,
        webhookUrl: webhook.webhookUrl.trim(),
        title: input.title,
        text: input.text,
      });
      return SendWebhookResponseDto.parse({ accepted: true, sent: true });
    }
    catch (error) {
      if (cooldownKey && cooldownToken) {
        try {
          await this.kvStore.delIfValue(cooldownKey, cooldownToken);
        }
        catch (cleanupError) {
          this.logger.error(`웹훅 발송 실패 후 쿨다운 해제에 실패했습니다: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`);
        }
      }
      throw error;
    }
  }
}
