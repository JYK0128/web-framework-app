import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Resource } from '#/entities/auth.extentions/resource.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { UpdateResourceCommand } from '#/modules/resources/commands/update-resource.command';
import { UpdateResourceResponseDto } from '#/modules/resources/dto/update-resource.dto';

@Injectable()
@CommandHandler(UpdateResourceCommand)
export class UpdateResourceHandler implements ICommandHandler<UpdateResourceCommand, UpdateResourceResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: UpdateResourceCommand): Promise<UpdateResourceResponseDto> {
    const resource = await this.em.findOne(Resource, { id: command.input.id });
    if (!resource) {
      throw new ApplicationError({ code: 'RESOURCE_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }

    const input = command.input.input;
    if (input.label !== undefined) resource.label = input.label.trim();
    if (input.description !== undefined) resource.description = input.description.trim() || null;
    if (input.actions !== undefined) resource.actions = [...new Set(input.actions.map((action) => action.trim().toLowerCase()).filter(Boolean))];
    if (resource.actions.length === 0) {
      throw new ApplicationError({ code: 'RESOURCE_ACTIONS_REQUIRED', status: HttpStatus.BAD_REQUEST });
    }

    return new UpdateResourceResponseDto(resource);
  }
}
