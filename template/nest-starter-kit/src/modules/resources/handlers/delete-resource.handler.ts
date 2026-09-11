import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Resource } from '#/entities/auth.extensions/resource.entity';
import { Role, type RolePermissions } from '#/entities/auth.extensions/role.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { DeleteResourceCommand } from '#/modules/resources/commands/delete-resource.command';
import { DeleteResourceResponseDto } from '#/modules/resources/dto/delete-resource.response.dto';

@Injectable()
@CommandHandler(DeleteResourceCommand)
export class DeleteResourceHandler implements ICommandHandler<DeleteResourceCommand, DeleteResourceResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: DeleteResourceCommand): Promise<DeleteResourceResponseDto> {
    const resource = await this.identify(command.input.id);
    this.verify(resource);
    return this.process(resource);
  }

  private async identify(id: string): Promise<Resource | null> {
    return this.em.findOne(Resource, { id });
  }

  private verify(resource: Resource | null): asserts resource is Resource {
    if (!resource) {
      throw new ApplicationError({ code: 'RESOURCE_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
  }

  private async process(resource: Resource): Promise<DeleteResourceResponseDto> {
    const roles = await this.em.find(Role, {});
    for (const role of roles) {
      if (!Object.hasOwn(role.permissions, resource.key)) continue;
      const permissions = { ...role.permissions } as RolePermissions;
      delete permissions[resource.key];
      role.permissions = permissions;
    }

    const result = DeleteResourceResponseDto.fromPlain({ id: resource.id, key: resource.key });
    this.em.remove(resource);
    return result;
  }
}
