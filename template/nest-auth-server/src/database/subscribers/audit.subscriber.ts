import { ChangeSetType, type EventArgs, type EventSubscriber, type FlushEventArgs } from '@mikro-orm/core';

import { requestContext } from '#/common/context/request-context';
import { BaseEntity } from '#/entities/common/base.entity';

export class AuditSubscriber implements EventSubscriber<BaseEntity> {
  beforeCreate({ entity }: EventArgs<BaseEntity>): void {
    if (!(entity instanceof BaseEntity)) return;

    const actorId = requestContext.getActorId();
    if (!actorId) return;

    entity.createdBy ??= actorId;
    entity.updatedBy ??= actorId;
  }

  beforeUpdate({ entity }: EventArgs<BaseEntity>): void {
    if (!(entity instanceof BaseEntity)) return;

    const actorId = requestContext.getActorId();
    if (!actorId) return;

    entity.updatedAt = new Date();
    entity.updatedBy = actorId;
  }

  onFlush({ uow }: FlushEventArgs): void {
    for (const changeSet of uow.getChangeSets()) {
      if (changeSet.type !== ChangeSetType.DELETE) continue;

      const entity = changeSet.entity;
      if (!(entity instanceof BaseEntity)) continue;

      const deletedAt = new Date();
      const actorId = requestContext.getActorId() ?? entity.createdBy;
      entity.updatedAt = deletedAt;
      entity.updatedBy = actorId;
      entity.deletedAt = deletedAt;
      entity.deletedBy = actorId;
      uow.computeChangeSet(entity, ChangeSetType.UPDATE);
    }
  }
}
