import { Command } from '@nestjs/cqrs';

import type { DeleteUserResponseDto } from '#/modules/users/dto';

export interface DeleteUserPayload {
  id: string
  currentUserId: string
}

export class DeleteUserCommand extends Command<DeleteUserResponseDto> {
  constructor(public readonly input: DeleteUserPayload) {
    super();
  }
}
