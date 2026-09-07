import { Injectable } from '@nestjs/common';

import { resolveDefaultBrandVariables, resolveSystemVariables } from '#/common/constants/message-variable-tier.constant';
import { MessageChannel, MessageTemplate } from '#/entities/templates/message-template.entity';
import { env } from '#/env';
import { AppEntityManager } from '#/infra/database/entity-manager';

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
  constructor(
    private readonly em: AppEntityManager,
  ) {}

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
   * 템플릿 코드와 변수를 전달받아 DB 조회 후 최종 렌더링된 제목과 본문을 반환합니다.
   * options.channel 미지정 시 최우선 순위(priority 1) 활성 채널을 자동 선택합니다.
   */
  async render(
    code: string,
    variables: Record<string, unknown> = {},
    options: RenderTemplateOptions = {},
  ): Promise<RenderedTemplate> {
    const mergedVariables = this.buildVariables(variables);
    const template = await this.getTemplate(code);

    if (template && template.isActive && template.channels.isInitialized()) {
      const activeChannels = template.channels
        .getItems()
        .filter((c) => c.isActive)
        .sort((a, b) => a.priority - b.priority);

      const targetChannel = options.channel
        ? activeChannels.find((c) => c.channel === options.channel)
        : activeChannels[0];

      if (targetChannel) {
        return {
          code: template.code,
          channel: targetChannel.channel,
          title: targetChannel.title ? this.interpolate(targetChannel.title, mergedVariables) : null,
          body: this.interpolate(targetChannel.body, mergedVariables),
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
   * 비즈니스 이벤트에 등록된 모든 활성 채널 템플릿을 우선순위 순으로 일괄 렌더링합니다.
   * 멀티캐스트 및 대체 발송(Fallback) 파이프라인에서 활용됩니다.
   */
  async renderEvent(
    code: string,
    variables: Record<string, unknown> = {},
  ): Promise<RenderedTemplate[]> {
    const template = await this.getTemplate(code);
    if (!template || !template.isActive || !template.channels.isInitialized()) {
      return [];
    }

    const mergedVariables = this.buildVariables(variables);

    return template.channels
      .getItems()
      .filter((c) => c.isActive)
      .sort((a, b) => a.priority - b.priority)
      .map((c) => ({
        code: template.code,
        channel: c.channel,
        title: c.title ? this.interpolate(c.title, mergedVariables) : null,
        body: this.interpolate(c.body, mergedVariables),
      }));
  }

  /**
   * DB 조회 (channels 관계 포함)
   */
  async getTemplate(code: string): Promise<MessageTemplate | null> {
    return this.em.findOne(
      MessageTemplate,
      { code, isActive: true },
      { populate: ['channels'], filters: false },
    );
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
