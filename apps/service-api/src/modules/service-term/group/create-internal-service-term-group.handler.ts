import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { AppEntityManager } from '@pkg/server-core/core/persistence';

import { TermGroup } from '~/core/database/entities/terms';
import { CreateInternalServiceTermGroupCommand } from '~/modules/service-term/group/create-internal-service-term-group.command';
import { CreateInternalServiceTermGroupResponseDto } from '~/modules/service-term/group/create-internal-service-term-group.response.dto';

@Injectable()
@CommandHandler(CreateInternalServiceTermGroupCommand)
export class CreateInternalServiceTermGroupHandler implements ICommandHandler<CreateInternalServiceTermGroupCommand, CreateInternalServiceTermGroupResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input }: CreateInternalServiceTermGroupCommand): Promise<CreateInternalServiceTermGroupResponseDto> {
    const group = this.em.create(TermGroup, { title: input.title.trim(), isRequired: input.isRequired, sortOrder: input.sortOrder });
    this.em.persist(group);
    return CreateInternalServiceTermGroupResponseDto.parseEntity(group);
  }
}
