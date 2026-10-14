import { Injectable } from '@nestjs/common';

import type { NotificationVariables } from './notification.interface';

@Injectable()
export class MessageTemplateService {
  render(template: string, variables?: NotificationVariables): string {
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
}
