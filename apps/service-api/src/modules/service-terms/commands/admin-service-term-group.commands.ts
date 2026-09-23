import { Command } from '@nestjs/cqrs';
import { AdminServiceTermGroupItemDto, AdminServiceTermGroupRequestDto } from '../dto';

export class CreateAdminServiceTermGroupCommand extends Command<AdminServiceTermGroupItemDto> {
  constructor(public readonly input: AdminServiceTermGroupRequestDto) { super(); }
}
export class UpdateAdminServiceTermGroupCommand extends Command<AdminServiceTermGroupItemDto> {
  constructor(public readonly input: { groupId: string; dto: AdminServiceTermGroupRequestDto }) { super(); }
}
export class DeleteAdminServiceTermGroupCommand extends Command<{ success: boolean }> {
  constructor(public readonly groupId: string) { super(); }
}
