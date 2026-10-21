import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Term, TermGroup } from '~/core/database/entities/terms';
import { AppEntityManager } from '~/core/database/entity-manager';
import { DeleteInternalServiceTermGroupCommand } from '~/modules/service-term/group/delete-internal-service-term-group.command';
import { DeleteInternalServiceTermGroupResponseDto } from '~/modules/service-term/group/delete-internal-service-term-group.response.dto';

@Injectable()
@CommandHandler(DeleteInternalServiceTermGroupCommand)
export class DeleteInternalServiceTermGroupHandler implements ICommandHandler<DeleteInternalServiceTermGroupCommand, DeleteInternalServiceTermGroupResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input }: DeleteInternalServiceTermGroupCommand): Promise<DeleteInternalServiceTermGroupResponseDto> {
    const group = await this.em.findOne(TermGroup, { id: input.groupId }, { filters: false });
    if (!group || group.deletedAt) throw new ApplicationError({ code: 'SERVICE_TERM_GROUP_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    if (await this.em.count(Term, { termGroup: group.id, publishedAt: { $lte: new Date() } }) > 0) throw new ApplicationError({ code: 'SERVICE_TERM_GROUP_HAS_PUBLISHED_TERMS', status: HttpStatus.CONFLICT });
    group.deletedAt = new Date();
    return DeleteInternalServiceTermGroupResponseDto.ok();
  }
}
