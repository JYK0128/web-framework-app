import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

import type { NotificationVariables } from './notification-request.interface';

@Injectable()
export class NotificationTemplateService {
  render(template: string, variables?: NotificationVariables): string {
    if (variables === undefined) return template;
    return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match: string, key: string) => {
      if (!Object.hasOwn(variables, key)) throw new ApplicationError({ code: 'BAD_REQUEST', status: HttpStatus.BAD_REQUEST });
      return String(variables[key]);
    });
  }

  renderAlimtalk(template: string, variables: Record<string, string> = {}): string {
    return template.replace(/#\{([^{}]+)\}/g, (_match: string, key: string) => {
      if (!Object.hasOwn(variables, key) || typeof variables[key] !== 'string') throw new ApplicationError({ code: 'BAD_REQUEST', status: HttpStatus.BAD_REQUEST });
      return variables[key];
    });
  }
}
