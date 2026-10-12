import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Term, TermGroup } from '#/core/database/entities/terms';
import { AppEntityManager } from '#/core/database/entity-manager';
import { DeleteInternalServiceTermGroupResponseDto, InternalServiceTermGroupItemDto } from '#/modules/service-terms';
import { CreateInternalServiceTermGroupCommand, DeleteInternalServiceTermGroupCommand, UpdateInternalServiceTermGroupCommand } from '#/modules/service-terms/groups/internal-service-term-group.commands';

@Injectable()
@CommandHandler(CreateInternalServiceTermGroupCommand)
export class CreateInternalServiceTermGroupHandler implements ICommandHandler<CreateInternalServiceTermGroupCommand, InternalServiceTermGroupItemDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input }: CreateInternalServiceTermGroupCommand): Promise<InternalServiceTermGroupItemDto> {
    const group = this.em.create(TermGroup, { title: input.title.trim(), isRequired: input.isRequired, sortOrder: input.sortOrder });
    this.em.persist(group);
    return InternalServiceTermGroupItemDto.parseEntity(group);
  }
}

@Injectable()
@CommandHandler(UpdateInternalServiceTermGroupCommand)
export class UpdateInternalServiceTermGroupHandler implements ICommandHandler<UpdateInternalServiceTermGroupCommand, InternalServiceTermGroupItemDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input }: UpdateInternalServiceTermGroupCommand): Promise<InternalServiceTermGroupItemDto> {
    const group = await this.em.findOne(TermGroup, { id: input.groupId }, { filters: false });
    if (!group || group.deletedAt) throw new ApplicationError({ code: 'SERVICE_TERM_GROUP_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    if (input.dto.title !== undefined) group.title = input.dto.title.trim();
    if (input.dto.isRequired !== undefined) group.isRequired = input.dto.isRequired;
    if (input.dto.sortOrder !== undefined) group.sortOrder = input.dto.sortOrder;
    return InternalServiceTermGroupItemDto.parseEntity(group);
  }
}

@Injectable()
@CommandHandler(DeleteInternalServiceTermGroupCommand)
export class DeleteInternalServiceTermGroupHandler implements ICommandHandler<DeleteInternalServiceTermGroupCommand, DeleteInternalServiceTermGroupResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input }: DeleteInternalServiceTermGroupCommand): Promise<DeleteInternalServiceTermGroupResponseDto> {
    const group = await this.em.findOne(TermGroup, { id: input.groupId }, { filters: false });
    if (!group || group.deletedAt) throw new ApplicationError({ code: 'SERVICE_TERM_GROUP_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    if (await this.em.count(Term, { termGroup: group.id, publishedAt: { $lte: new Date() } }) > 0) throw new ApplicationError({ code: 'SERVICE_TERM_GROUP_HAS_PUBLISHED_TERMS', status: HttpStatus.CONFLICT });
    group.deletedAt = new Date();
    return DeleteInternalServiceTermGroupResponseDto.parse({ ok: true });
  }
}
