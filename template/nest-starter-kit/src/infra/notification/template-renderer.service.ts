import { Injectable } from '@nestjs/common';

import { MessageChannel, MessageTemplate } from '#/entities/templates/message-template.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';

export interface RenderTemplateOptions {
  fallback?: {
    title?: string
    body?: string
    channel?: MessageChannel
  }
}

export interface RenderedTemplate {
  code: string
  channel: MessageChannel
  title: string | null
  body: string
}

@Injectable()
export class TemplateRendererService {
  constructor(
    private readonly em: AppEntityManager,
  ) {}

  /**
   * 템플릿 코드와 변수를 전달받아 DB 조회 후 최종 렌더링된 제목과 본문을 반환합니다.
   */
  async render(
    code: string,
    variables: Record<string, unknown> = {},
    options: RenderTemplateOptions = {},
  ): Promise<RenderedTemplate> {
    const template = await this.getTemplate(code);

    if (template && template.isActive) {
      return {
        code: template.code,
        channel: template.channel,
        title: template.title ? this.interpolate(template.title, variables) : null,
        body: this.interpolate(template.body, variables),
      };
    }

    // Fallback 처리
    if (options.fallback) {
      return {
        code,
        channel: options.fallback.channel ?? MessageChannel.IN_APP,
        title: options.fallback.title ? this.interpolate(options.fallback.title, variables) : null,
        body: options.fallback.body ? this.interpolate(options.fallback.body, variables) : '',
      };
    }

    throw new Error(`Template not found for code '${code}' and no fallback provided.`);
  }

  /**
   * DB 조회
   */
  async getTemplate(code: string): Promise<MessageTemplate | null> {
    return this.em.findOne(MessageTemplate, { code, isActive: true }, { filters: false });
  }

  /**
   * 문자열 내 {{variable}} 치환
   */
  interpolate(templateText: string, variables: Record<string, unknown>): string {
    if (!templateText) return '';
    return templateText.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
      const val = variables[key];
      if (val === undefined || val === null) return '';
      if (typeof val === 'string') return val;
      if (typeof val === 'number' || typeof val === 'boolean' || typeof val === 'bigint') return String(val);
      if (typeof val === 'object') return JSON.stringify(val);
      return '';
    });
  }
}
