import { ChangeSetType, type EventArgs, type EventSubscriber, type FlushEventArgs } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import { RequestContext } from '#/common/contexts/request.context';
import { BaseEntity } from '#/entities/common/base.entity';

@Injectable()
export class AuditSubscriber implements EventSubscriber<BaseEntity> {
  constructor(private readonly requestContext: RequestContext) {}
  beforeCreate({ entity }: EventArgs<BaseEntity>): void {
    if (!(entity instanceof BaseEntity)) return;

    const actorId = this.getActorId();
    entity.createdBy = actorId;
    entity.updatedBy = actorId;
  }

  beforeUpdate({ entity }: EventArgs<BaseEntity>): void {
    if (!(entity instanceof BaseEntity)) return;

    entity.updatedAt = new Date();

    const actorId = this.getActorId();
    entity.updatedBy = actorId;
  }

  beforeUpsert({ entity }: EventArgs<BaseEntity>): void {
    entity.updatedAt = new Date();

    const actorId = this.getActorId();
    entity.createdBy ??= actorId;
    entity.updatedBy = actorId;
  }

  onFlush({ uow }: FlushEventArgs): void {
    for (const changeSet of uow.getChangeSets()) {
      if (changeSet.type !== ChangeSetType.DELETE) continue;

      const entity = changeSet.entity;
      if (!(entity instanceof BaseEntity)) continue;

      const deletedAt = new Date();
      entity.updatedAt = deletedAt;
      entity.deletedAt = deletedAt;

      const actorId = this.getActorId();
      entity.updatedBy = actorId;
      entity.deletedBy = actorId;

      uow.computeChangeSet(entity, ChangeSetType.UPDATE);
    }
  }

  private getActorId(): string | null {
    return this.requestContext.request?.session?.user?.id ?? null;
  }
}
