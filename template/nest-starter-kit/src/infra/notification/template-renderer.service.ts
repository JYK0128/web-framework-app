import { Injectable } from '@nestjs/common';

import { MessageChannel, MessageTemplate } from '#/entities/templates/message-template.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';

export interface RenderTemplateOptions {
  locale?: string
  fallback?: {
    title?: string
    body?: string
    channel?: MessageChannel
  }
}

export interface RenderedTemplate {
  code: string
  locale: string
  channel: MessageChannel
  title: string | null
  body: string
}

@Injectable()
export class TemplateRendererService {
  private static readonly DEFAULT_LOCALE = 'ko';

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
    const targetLocale = options.locale || TemplateRendererService.DEFAULT_LOCALE;
    const template = await this.getTemplate(code, targetLocale);

    if (template && template.isActive) {
      return {
        code: template.code,
        locale: template.locale,
        channel: template.channel,
        title: template.title ? this.interpolate(template.title, variables) : null,
        body: this.interpolate(template.body, variables),
      };
    }

    // Fallback 처리
    if (options.fallback) {
      return {
        code,
        locale: targetLocale,
        channel: options.fallback.channel ?? MessageChannel.IN_APP,
        title: options.fallback.title ? this.interpolate(options.fallback.title, variables) : null,
        body: options.fallback.body ? this.interpolate(options.fallback.body, variables) : '',
      };
    }

    throw new Error(`Template not found for code '${code}' (locale: '${targetLocale}') and no fallback provided.`);
  }

  /**
   * DB 조회 (요청 언어 -> ko 기본 언어 Fallback)
   */
  async getTemplate(code: string, locale: string = TemplateRendererService.DEFAULT_LOCALE): Promise<MessageTemplate | null> {
    // 1. 요청 언어 DB 조회
    let template = await this.em.findOne(MessageTemplate, { code, locale, isActive: true }, { filters: false });

    // 2. 요청 언어 미존재 시 기본 언어('ko') Fallback 조회
    if (!template && locale !== TemplateRendererService.DEFAULT_LOCALE) {
      template = await this.em.findOne(MessageTemplate, { code, locale: TemplateRendererService.DEFAULT_LOCALE, isActive: true }, { filters: false });
    }

    return template;
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
