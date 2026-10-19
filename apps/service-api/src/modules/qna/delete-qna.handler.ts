import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { PrincipalContext } from '@pkg/server-core/http/contexts/principal.context';

import { AppEntityManager } from '#/core/database/entity-manager';
import { DeleteQnaCommand } from '#/modules/qna/delete-qna.command';
import { DeleteQnaResponseDto } from '#/modules/qna/delete-qna.response.dto';
import { findQna } from '#/modules/qna/qna.helpers';

@CommandHandler(DeleteQnaCommand)
export class DeleteQnaHandler implements ICommandHandler<DeleteQnaCommand, DeleteQnaResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}
  async execute({ input }: DeleteQnaCommand): Promise<DeleteQnaResponseDto> {
    const id = input.qnaId;
    const mine = false;
    const qna = await findQna(this.em, this.principal, id, mine);
    qna.deletedAt = new Date();
    await this.em.flush();
    return DeleteQnaResponseDto.ok();
  }
}
