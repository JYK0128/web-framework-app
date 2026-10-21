import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { PrincipalContext } from '@pkg/server-core/http/contexts';

import { AppEntityManager } from '~/core/database/entity-manager';
import { DeleteOwnQnaCommand } from '~/modules/qna/delete-own-qna.command';
import { DeleteOwnQnaResponseDto } from '~/modules/qna/delete-own-qna.response.dto';
import { findQna } from '~/modules/qna/qna.helpers';

@CommandHandler(DeleteOwnQnaCommand)
export class DeleteOwnQnaHandler implements ICommandHandler<DeleteOwnQnaCommand, DeleteOwnQnaResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}
  async execute({ input }: DeleteOwnQnaCommand): Promise<DeleteOwnQnaResponseDto> {
    const id = input.qnaId;
    const mine = true;
    const qna = await findQna(this.em, this.principal, id, mine);
    qna.deletedAt = new Date();
    await this.em.flush();
    return DeleteOwnQnaResponseDto.ok();
  }
}
