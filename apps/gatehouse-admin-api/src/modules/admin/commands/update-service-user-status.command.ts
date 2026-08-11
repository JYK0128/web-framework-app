import { Command } from '@nestjs/cqrs';

import { ServiceUpdateUserStatusRequestDto, ServiceUserDto } from '#/modules/admin/service-user.dto';

export class UpdateServiceUserStatusCommand extends Command<ServiceUserDto> {
  constructor(
    public readonly id: string,
    public readonly input: ServiceUpdateUserStatusRequestDto,
  ) {
    super();
  }
}
