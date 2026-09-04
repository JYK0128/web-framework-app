import { type CreateRoleRequestDto } from '#/modules/roles/dto';

export class CreateRoleCommand {
  constructor(public readonly input: CreateRoleRequestDto) {}
}
