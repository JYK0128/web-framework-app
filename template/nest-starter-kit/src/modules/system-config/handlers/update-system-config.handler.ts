import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { SystemContext } from '#/common/contexts/system.context';
import { ConfigCategory, SystemConfig, SystemConfigKey } from '#/entities/system-config/system-config.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { EventBroker } from '#/infra/event-broker';
import { UpdateSystemConfigCommand } from '#/modules/system-config/commands/update-system-config.command';
import { type NotificationConfigDto, type OAuthConfigDto, UpdateSystemConfigResponseDto } from '#/modules/system-config/dto';
import { SystemConfigUpdatedEvent } from '#/modules/system-config/events/system-config-updated.event';

@Injectable()
@CommandHandler(UpdateSystemConfigCommand)
export class UpdateSystemConfigHandler implements ICommandHandler<UpdateSystemConfigCommand, UpdateSystemConfigResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly eventBroker: EventBroker,
    private readonly systemContext: SystemContext,
  ) {}

  async execute(command: UpdateSystemConfigCommand): Promise<UpdateSystemConfigResponseDto> {
    const keysToUpdate: SystemConfigKey[] = [];
    if (command.input.operation) keysToUpdate.push(SystemConfigKey.OPERATION);
    if (command.input.maintenance) keysToUpdate.push(SystemConfigKey.MAINTENANCE);
    if (command.input.security) keysToUpdate.push(SystemConfigKey.SECURITY);
    if (command.input.inquiry) keysToUpdate.push(SystemConfigKey.INQUIRY);
    if (command.input.notification) keysToUpdate.push(SystemConfigKey.NOTIFICATION);
    if (command.input.oauth) keysToUpdate.push(SystemConfigKey.OAUTH);

    if (keysToUpdate.length === 0) {
      return { ok: true, updatedKeys: [] };
    }

    const configs = await this.identify(keysToUpdate);
    this.process(configs, command);
    await this.em.flush();

    await this.systemContext.clearCache(keysToUpdate);
    await this.eventBroker.publish(new SystemConfigUpdatedEvent(keysToUpdate, command.adminUser.id));

    return { ok: true, updatedKeys: keysToUpdate };
  }

  private async identify(keys: SystemConfigKey[]): Promise<Map<SystemConfigKey, SystemConfig>> {
    const entities = await this.em.find(SystemConfig, { key: { $in: keys } }, { filters: false });
    const entityMap = new Map<SystemConfigKey, SystemConfig>(entities.map((e) => [e.key, e]));

    for (const key of keys) {
      if (!entityMap.has(key)) {
        const entity = new SystemConfig();
        entity.key = key;
        entity.category = key.toUpperCase() as ConfigCategory;
        entity.value = {};
        entity.isPublic = key === SystemConfigKey.OPERATION || key === SystemConfigKey.MAINTENANCE;
        entity.description = `${key} configuration`;
        this.em.persist(entity);
        entityMap.set(key, entity);
      }
    }

    return entityMap;
  }

  private process(
    entityMap: Map<SystemConfigKey, SystemConfig>,
    command: UpdateSystemConfigCommand,
  ): void {
    const { operation, maintenance, security, inquiry } = command.input;
    const adminId = command.adminUser.id;

    if (operation) {
      this.updateOperation(entityMap.get('operation')!, operation, adminId);
    }
    if (maintenance) {
      this.updateMaintenance(entityMap.get('maintenance')!, maintenance, adminId);
    }
    if (security) {
      this.updateSecurity(entityMap.get('security')!, security, adminId);
    }
    if (inquiry) {
      this.updateInquiry(entityMap.get('inquiry')!, inquiry, adminId);
    }
    if (command.input.notification) {
      this.updateNotification(entityMap.get('notification')!, command.input.notification, adminId);
    }
    if (command.input.oauth) {
      this.updateOAuth(entityMap.get('oauth')!, command.input.oauth, adminId);
    }
  }

  private updateOAuth(
    entity: SystemConfig,
    oauth: NonNullable<UpdateSystemConfigCommand['input']['oauth']>,
    adminId: string,
  ): void {
    const existing = (entity.value ?? {}) as Partial<OAuthConfigDto>;

    const buildProvider = (
      inputProvider?: { enabled?: boolean, clientId?: string, clientSecret?: string, scope?: string },
      existingProvider?: { clientId?: string, clientSecret?: string, scope?: string },
    ) => {
      if (!inputProvider) return undefined;
      return {
        enabled: Boolean(inputProvider.enabled),
        clientId: inputProvider.clientId ?? existingProvider?.clientId ?? '',
        clientSecret: inputProvider.clientSecret || existingProvider?.clientSecret || '',
        scope: inputProvider.scope ?? existingProvider?.scope ?? '',
      };
    };

    entity.value = {
      google: buildProvider(oauth.google, existing.google),
      kakao: buildProvider(oauth.kakao, existing.kakao),
      naver: buildProvider(oauth.naver, existing.naver),
      github: buildProvider(oauth.github, existing.github),
    };
    entity.updatedBy = adminId;
  }

  private updateNotification(
    entity: SystemConfig,
    notification: NonNullable<UpdateSystemConfigCommand['input']['notification']>,
    adminId: string,
  ): void {
    const existing = (entity.value ?? {}) as Partial<NotificationConfigDto>;

    entity.value = {
      email: this.buildEmailConfig(notification.email, existing.email),
      messenger: notification.messenger ? this.buildMessengerConfig(notification.messenger, existing.messenger) : undefined,
      sms: notification.sms ? this.buildSmsConfig(notification.sms, existing.sms) : undefined,
      push: notification.push ? this.buildPushConfig(notification.push, existing.push) : undefined,
    };
    entity.updatedBy = adminId;
  }

  private buildEmailConfig(
    email: NonNullable<UpdateSystemConfigCommand['input']['notification']>['email'],
    existing?: NotificationConfigDto['email'],
  ) {
    return {
      from: email.from,
      smtp: email.smtp
        ? {
          host: email.smtp.host,
          port: email.smtp.port,
          secure: email.smtp.secure,
          user: email.smtp.user,
          pass: email.smtp.pass || existing?.smtp?.pass || '',
        }
        : undefined,
    };
  }

  private buildMessengerConfig(
    messenger: NonNullable<NonNullable<UpdateSystemConfigCommand['input']['notification']>['messenger']>,
    existing?: NotificationConfigDto['messenger'],
  ) {
    return {
      ...messenger,
      kakao: messenger.kakao
        ? {
          ...messenger.kakao,
          nhn: messenger.kakao.nhn
            ? { ...messenger.kakao.nhn, secretKey: messenger.kakao.nhn.secretKey || existing?.kakao?.nhn?.secretKey || '' }
            : undefined,
          solapi: messenger.kakao.solapi
            ? { ...messenger.kakao.solapi, apiSecret: messenger.kakao.solapi.apiSecret || existing?.kakao?.solapi?.apiSecret || '' }
            : undefined,
          aligo: messenger.kakao.aligo
            ? { ...messenger.kakao.aligo, apiKey: messenger.kakao.aligo.apiKey || existing?.kakao?.aligo?.apiKey || '' }
            : undefined,
        }
        : undefined,
      line: messenger.line
        ? {
          ...messenger.line,
          channelSecret: messenger.line.channelSecret || existing?.line?.channelSecret || '',
          accessToken: messenger.line.accessToken || existing?.line?.accessToken || '',
        }
        : undefined,
      whatsapp: messenger.whatsapp ? { ...messenger.whatsapp, accessToken: messenger.whatsapp.accessToken || existing?.whatsapp?.accessToken || '' } : undefined,
      telegram: messenger.telegram ? { ...messenger.telegram, botToken: messenger.telegram.botToken || existing?.telegram?.botToken || '' } : undefined,
      wechat: messenger.wechat ? { ...messenger.wechat, appSecret: messenger.wechat.appSecret || existing?.wechat?.appSecret || '' } : undefined,
    };
  }

  private buildSmsConfig(
    sms: NonNullable<NonNullable<UpdateSystemConfigCommand['input']['notification']>['sms']>,
    existing?: NotificationConfigDto['sms'],
  ) {
    return {
      ...sms,
      nhn: sms.nhn ? { ...sms.nhn, secretKey: sms.nhn.secretKey || existing?.nhn?.secretKey || '' } : undefined,
      solapi: sms.solapi ? { ...sms.solapi, apiSecret: sms.solapi.apiSecret || existing?.solapi?.apiSecret || '' } : undefined,
      aligo: sms.aligo ? { ...sms.aligo, apiKey: sms.aligo.apiKey || existing?.aligo?.apiKey || '' } : undefined,
    };
  }

  private buildPushConfig(
    push: NonNullable<NonNullable<UpdateSystemConfigCommand['input']['notification']>['push']>,
    existing?: NotificationConfigDto['push'],
  ) {
    return {
      ...push,
      fcm: push.fcm
        ? {
          ...push.fcm,
          apiKey: push.fcm.apiKey || existing?.fcm?.apiKey || '',
        }
        : undefined,
      nhn: push.nhn
        ? {
          ...push.nhn,
          secretKey: push.nhn.secretKey || existing?.nhn?.secretKey || '',
        }
        : undefined,
      sns: push.sns
        ? {
          ...push.sns,
          secretAccessKey: push.sns.secretAccessKey || existing?.sns?.secretAccessKey || '',
        }
        : undefined,
      oracle: push.oracle ? { ...push.oracle } : undefined,
    };
  }

  private updateOperation(
    entity: SystemConfig,
    operation: NonNullable<UpdateSystemConfigCommand['input']['operation']>,
    adminId: string,
  ): void {
    const existing = entity.value ?? {};
    entity.value = {
      hours: operation.hours ? { ...operation.hours } : existing.hours,
      holidays: operation.holidays ? [...operation.holidays] : existing.holidays,
      messages: operation.messages ? { ...operation.messages } : existing.messages,
    };
    entity.updatedBy = adminId;
  }

  private updateMaintenance(
    entity: SystemConfig,
    maintenance: NonNullable<UpdateSystemConfigCommand['input']['maintenance']>,
    adminId: string,
  ): void {
    entity.value = {
      temporary: maintenance.temporary ? { ...maintenance.temporary } : undefined,
      recurring: maintenance.recurring ? { ...maintenance.recurring } : undefined,
    };
    entity.updatedBy = adminId;
  }

  private updateSecurity(
    entity: SystemConfig,
    security: NonNullable<UpdateSystemConfigCommand['input']['security']>,
    adminId: string,
  ): void {
    entity.value = {
      registration: security.registration ? { ...security.registration } : undefined,
      session: security.session ? { ...security.session } : undefined,
      lockout: security.lockout ? { ...security.lockout } : undefined,
      password: security.password ? { ...security.password } : undefined,
      twoFactor: security.twoFactor ? { ...security.twoFactor } : undefined,
    };
    entity.updatedBy = adminId;
  }

  private updateInquiry(
    entity: SystemConfig,
    inquiry: NonNullable<UpdateSystemConfigCommand['input']['inquiry']>,
    adminId: string,
  ): void {
    entity.value = {
      unansweredThresholdMinutes: inquiry.unansweredThresholdMinutes,
      autoCloseHours: inquiry.autoCloseHours,
      notification: inquiry.notification ? { ...inquiry.notification } : undefined,
    };
    entity.updatedBy = adminId;
  }
}
