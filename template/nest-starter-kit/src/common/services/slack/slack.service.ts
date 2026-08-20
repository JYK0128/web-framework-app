import { Inject, Injectable, Logger, Optional } from '@nestjs/common';

import { env } from '#/env';

export const SLACK_MODULE_OPTIONS = Symbol('SLACK_MODULE_OPTIONS');

export interface SlackModuleOptions {
  webhookUrl?: string
}

export type SlackNotificationLevel = 'info' | 'warn' | 'error';

export interface SlackNotificationField {
  label: string
  value: string
}

export interface SlackNotificationOptions {
  /** 알림 헤더 제목 */
  title: string
  /** 알림 수준 ('info' | 'warn' | 'error', 기본값: 'info') */
  level?: SlackNotificationLevel
  /** 1열(전체 너비)로 출력될 필드 목록 (예: 제목, 내용) */
  sections?: SlackNotificationField[]
  /** 2열(그리드)로 출력될 필드 목록 (예: 카테고리, 작성자, 담당자 등) */
  fields?: SlackNotificationField[]
  /** 바로가기 링크 버튼/텍스트 */
  action?: {
    text: string
    url: string
  }
  /** 하단 부가 설명 컨텍스트 */
  footer?: string
  /** 개별 웹훅 URL (미지정 시 module options 또는 env.SLACK_WEBHOOK_URL 사용) */
  webhookUrl?: string
}

const LEVEL_ICONS: Record<SlackNotificationLevel, string> = {
  info: 'ℹ️',
  warn: '⚠️',
  error: '🚨',
};

@Injectable()
export class SlackService {
  private readonly logger = new Logger(SlackService.name);
  private readonly defaultWebhookUrl?: string;

  constructor(
    @Optional()
    @Inject(SLACK_MODULE_OPTIONS)
    options?: SlackModuleOptions,
  ) {
    this.defaultWebhookUrl = options?.webhookUrl ?? env.SLACK_WEBHOOK_URL;
  }

  /**
   * 정형화된 카드 형태의 Slack 알림을 전송합니다.
   */
  async sendNotification(options: SlackNotificationOptions): Promise<boolean> {
    const webhookUrl = options.webhookUrl || this.defaultWebhookUrl;
    if (!webhookUrl) {
      this.logger.debug('Slack webhook URL is not configured. Skipping notification.');
      return false;
    }

    const level = options.level ?? 'info';
    const icon = LEVEL_ICONS[level];
    const blocks: unknown[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${icon} ${options.title}`,
          emoji: true,
        },
      },
    ];

    if (options.sections && options.sections.length > 0) {
      for (const section of options.sections) {
        const quoted = section.value.replace(/\n/g, '\n>');
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${section.label}*\n>${quoted}`,
          },
        });
      }
    }

    if (options.fields && options.fields.length > 0) {
      blocks.push({
        type: 'section',
        fields: options.fields.map((f) => ({
          type: 'mrkdwn',
          text: `*${f.label}*\n>${f.value.replace(/\n/g, '\n>')}`,
        })),
      });
    }

    if (options.action) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `<${options.action.url}|${options.action.text}>`,
        },
      });
    }

    if (options.footer) {
      blocks.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: options.footer,
          },
        ],
      });
    }

    return this.sendRawBlocks(blocks, webhookUrl);
  }

  /**
   * 단순 텍스트 메시지를 Slack으로 전송합니다.
   */
  async sendText(text: string, webhookUrl?: string): Promise<boolean> {
    const targetUrl = webhookUrl || this.defaultWebhookUrl;
    if (!targetUrl) return false;

    return this.sendRawBlocks(
      [
        {
          type: 'section',
          text: { type: 'mrkdwn', text },
        },
      ],
      targetUrl,
    );
  }

  /**
   * 로우 Block Kit 배열을 Slack Webhook으로 전송합니다.
   */
  async sendRawBlocks(blocks: unknown[], webhookUrl?: string): Promise<boolean> {
    const targetUrl = webhookUrl || this.defaultWebhookUrl;
    if (!targetUrl) return false;

    try {
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks }),
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) {
        this.logger.warn(`Slack webhook responded with ${res.status}: ${await res.text()}`);
        return false;
      }

      return true;
    }
    catch (err) {
      this.logger.error(`Slack webhook request failed: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  }
}
