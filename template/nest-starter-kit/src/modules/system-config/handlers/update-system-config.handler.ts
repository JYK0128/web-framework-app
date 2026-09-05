import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { SystemContext } from '#/common/contexts/system.context';
import { SystemConfig, type SystemConfigKey } from '#/entities/system-config/system-config.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { EventBroker } from '#/infra/event-broker';
import { UpdateSystemConfigCommand } from '#/modules/system-config/commands/update-system-config.command';
import { UpdateSystemConfigResponseDto } from '#/modules/system-config/dto';
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
    if (command.input.operation) keysToUpdate.push('operation');
    if (command.input.maintenance) keysToUpdate.push('maintenance');
    if (command.input.security) keysToUpdate.push('security');
    if (command.input.inquiry) keysToUpdate.push('inquiry');

    if (keysToUpdate.length === 0) {
      return { ok: true };
    }

    const configs = await this.identify(keysToUpdate);
    this.process(configs, command);
    await this.em.flush();

    await this.systemContext.clearCache(keysToUpdate);
    await this.eventBroker.publish(new SystemConfigUpdatedEvent(keysToUpdate, command.adminUser.id));

    return { ok: true };
  }

  private async identify(keys: SystemConfigKey[]): Promise<Map<SystemConfigKey, SystemConfig>> {
    const entities = await this.em.find(SystemConfig, { key: { $in: keys } }, { filters: false });
    const entityMap = new Map<SystemConfigKey, SystemConfig>(entities.map((e) => [e.key, e]));

    for (const key of keys) {
      if (!entityMap.has(key)) {
        throw new ApplicationError({
          code: 'SYSTEM_CONFIG_NOT_FOUND',
          status: HttpStatus.NOT_FOUND,
          params: { key },
        });
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
