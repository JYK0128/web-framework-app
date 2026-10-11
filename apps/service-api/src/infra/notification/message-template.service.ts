import { Injectable } from '@nestjs/common';

import type { MessageVariables, WebhookContent } from './message.interface';

@Injectable()
export class MessageTemplateService {
  render(template: string, variables?: MessageVariables): string {
    if (variables === undefined) return template;
    return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match: string, key: string) => {
      if (!Object.hasOwn(variables, key)) throw new Error(`Missing message template variable: ${key}`);
      return String(variables[key]);
    });
  }

  renderAlimtalk(template: string, variables: Record<string, string> = {}): string {
    return template.replace(/#\{([^{}]+)\}/g, (_match: string, key: string) => {
      if (!Object.hasOwn(variables, key) || typeof variables[key] !== 'string') throw new Error(`알림톡 변수 값이 필요합니다: ${key}`);
      return variables[key];
    });
  }

  webhookPayload(message: WebhookContent, variables?: MessageVariables): Record<string, unknown> {
    const title = this.render(message.title, variables);
    const text = this.render(message.text, variables);
    switch (message.type) {
      case 'SLACK':
        return {
          blocks: [
            { type: 'header', text: { type: 'plain_text', text: title, emoji: true } },
            { type: 'section', text: { type: 'plain_text', text } },
          ],
        };
      case 'DISCORD': return { content: text };
      case 'CHANNEL_TALK': return { text };
      case 'TEAMS': return { '@type': 'MessageCard', '@context': 'http://schema.org/extensions', 'summary': title, title, text };
      default: throw new Error(`Unsupported webhook message type: ${message.type}`);
    }
  }
}
