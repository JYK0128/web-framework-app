import { Injectable } from '@nestjs/common';

import { MESSAGE_TEMPLATE_CATALOG, type MessageTemplateCatalogItem } from '#/common/constants/message-template-catalog.constant';
import { resolveDefaultBrandVariables, resolveSystemVariables } from '#/common/constants/message-variable-tier.constant';
import { MessageChannel } from '#/entities/templates/message-channel.enum';
import { env } from '#/env';

export { MessageChannel } from '#/entities/templates/message-channel.enum';

export interface RenderTemplateOptions {
  channel?: MessageChannel
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
  private readonly catalogMap = new Map<string, MessageTemplateCatalogItem>(
    MESSAGE_TEMPLATE_CATALOG.map((item) => [item.code, item]),
  );

  /**
   * 1계층(브랜드 상수) + 2계층(시스템 런타임 변수) + 3계층(이벤트 페이로드) 3계층 변수 맵을 합성합니다.
   */
  buildVariables(eventVariables: Record<string, unknown> = {}): Record<string, unknown> {
    const brandVars = resolveDefaultBrandVariables(env.APP_NAME);
    const systemVars = resolveSystemVariables(new Date());

    // 3계층 이벤트 변수 (payload.xxx 네임스페이스도 지원)
    const payloadVars: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(eventVariables)) {
      payloadVars[k] = v;
      if (!k.startsWith('payload.')) {
        payloadVars[`payload.${k}`] = v;
      }
    }

    return {
      ...brandVars,
      ...systemVars,
      ...payloadVars,
    };
  }

  /**
   * 템플릿 코드와 변수를 전달받아 카탈로그 조회 후 최종 렌더링된 제목과 본문을 반환합니다.
   * options.channel 미지정 시 최우선 순위(priority 1) 채널을 자동 선택합니다.
   */
  async render(
    code: string,
    variables: Record<string, unknown> = {},
    options: RenderTemplateOptions = {},
  ): Promise<RenderedTemplate> {
    const mergedVariables = this.buildVariables(variables);
    const template = this.getTemplate(code);

    if (template && template.channels.length > 0) {
      const sortedChannels = [...template.channels].sort((a, b) => a.priority - b.priority);
      const targetChannel = options.channel
        ? sortedChannels.find((c) => c.channel === options.channel)
        : sortedChannels[0];

      if (targetChannel) {
        return {
          code: template.code,
          channel: targetChannel.channel,
          title: targetChannel.defaultTitle ? this.interpolate(targetChannel.defaultTitle, mergedVariables) : null,
          body: this.interpolate(targetChannel.defaultBody, mergedVariables),
        };
      }
    }

    // Fallback 처리
    if (options.fallback) {
      return {
        code,
        channel: options.fallback.channel ?? options.channel ?? MessageChannel.IN_APP,
        title: options.fallback.title ? this.interpolate(options.fallback.title, mergedVariables) : null,
        body: options.fallback.body ? this.interpolate(options.fallback.body, mergedVariables) : '',
      };
    }

    throw new Error(`Template not found for code '${code}' (channel: ${options.channel ?? 'any'}) and no fallback provided.`);
  }

  /**
   * 특정 채널을 명시하여 템플릿을 렌더링합니다.
   */
  async renderChannel(
    code: string,
    channel: MessageChannel,
    variables: Record<string, unknown> = {},
    options: Omit<RenderTemplateOptions, 'channel'> = {},
  ): Promise<RenderedTemplate> {
    return this.render(code, variables, { ...options, channel });
  }

  /**
   * 비즈니스 이벤트에 등록된 모든 채널 템플릿을 우선순위 순으로 일괄 렌더링합니다.
   */
  async renderEvent(
    code: string,
    variables: Record<string, unknown> = {},
  ): Promise<RenderedTemplate[]> {
    const template = this.getTemplate(code);
    if (!template || template.channels.length === 0) {
      return [];
    }

    const mergedVariables = this.buildVariables(variables);

    return [...template.channels]
      .sort((a, b) => a.priority - b.priority)
      .map((c) => ({
        code: template.code,
        channel: c.channel,
        title: c.defaultTitle ? this.interpolate(c.defaultTitle, mergedVariables) : null,
        body: this.interpolate(c.defaultBody, mergedVariables),
      }));
  }

  /**
   * 카탈로그 정의 조회
   */
  getTemplate(code: string): MessageTemplateCatalogItem | null {
    return this.catalogMap.get(code) ?? null;
  }

  /**
   * 문자열 내 {{variable}} 치환 (3계층 네임스페이스 점 표기법 지원)
   */
  interpolate(templateText: string, variables: Record<string, unknown>): string {
    if (!templateText) return '';
    return templateText.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key: string) => {
      const val = variables[key];
      if (val === undefined || val === null) return '';
      if (typeof val === 'string') return val;
      if (typeof val === 'number' || typeof val === 'boolean' || typeof val === 'bigint') return String(val);
      if (typeof val === 'object') return JSON.stringify(val);
      return '';
    });
  }
}
