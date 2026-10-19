import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { PrincipalContext } from '@pkg/server-core/http/contexts/principal.context';

import { AppEntityManager } from '#/core/database/entity-manager';
import { findQna } from '#/modules/qna/qna.helpers';
import { UpdateOwnQnaCommand } from '#/modules/qna/update-own-qna.command';
import { UpdateOwnQnaResponseDto } from '#/modules/qna/update-own-qna.response.dto';

@CommandHandler(UpdateOwnQnaCommand)
export class UpdateOwnQnaHandler implements ICommandHandler<UpdateOwnQnaCommand, UpdateOwnQnaResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}
  async execute({ input }: UpdateOwnQnaCommand): Promise<UpdateOwnQnaResponseDto> {
    const qna = await findQna(this.em, this.principal, input.qnaId, true);
    if (input.dto.status !== undefined) qna.status = input.dto.status;
    await this.em.flush();
    return UpdateOwnQnaResponseDto.parseEntity(qna);
  }
}
