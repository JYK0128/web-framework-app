import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Term } from '#/entities/terms/term.entity';
import { TermGroup } from '#/entities/terms/term-group.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { CreateInternalServiceTermGroupCommand, DeleteInternalServiceTermGroupCommand, UpdateInternalServiceTermGroupCommand } from '#/modules/service-terms/commands';
import { InternalServiceTermGroupItemDto } from '#/modules/service-terms/dto';

import { toGroup } from './get-internal-service-term-groups.handler';

@Injectable()
@CommandHandler(CreateInternalServiceTermGroupCommand)
export class CreateInternalServiceTermGroupHandler implements ICommandHandler<CreateInternalServiceTermGroupCommand, InternalServiceTermGroupItemDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input }: CreateInternalServiceTermGroupCommand): Promise<InternalServiceTermGroupItemDto> {
    const group = this.em.create(TermGroup, { title: input.title.trim(), isRequired: input.isRequired, sortOrder: input.sortOrder });
    this.em.persist(group);
    return toGroup(group);
  }
}

@Injectable()
@CommandHandler(UpdateInternalServiceTermGroupCommand)
export class UpdateInternalServiceTermGroupHandler implements ICommandHandler<UpdateInternalServiceTermGroupCommand, InternalServiceTermGroupItemDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input }: UpdateInternalServiceTermGroupCommand): Promise<InternalServiceTermGroupItemDto> {
    const group = await this.em.findOne(TermGroup, { id: input.groupId }, { filters: false });
    if (!group || group.deletedAt) throw new ApplicationError({ code: 'SERVICE_TERM_GROUP_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    group.title = input.dto.title.trim();
    group.isRequired = input.dto.isRequired;
    group.sortOrder = input.dto.sortOrder;
    return toGroup(group);
  }
}

@Injectable()
@CommandHandler(DeleteInternalServiceTermGroupCommand)
export class DeleteInternalServiceTermGroupHandler implements ICommandHandler<DeleteInternalServiceTermGroupCommand, { success: boolean }> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ groupId }: DeleteInternalServiceTermGroupCommand): Promise<{ success: boolean }> {
    const group = await this.em.findOne(TermGroup, { id: groupId }, { filters: false });
    if (!group || group.deletedAt) throw new ApplicationError({ code: 'SERVICE_TERM_GROUP_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    if (await this.em.count(Term, { termGroup: group.id, publishedAt: { $lte: new Date() } }) > 0) throw new ApplicationError({ code: 'SERVICE_TERM_GROUP_HAS_PUBLISHED_TERMS', status: HttpStatus.CONFLICT });
    group.deletedAt = new Date();
    return { success: true };
  }
}
