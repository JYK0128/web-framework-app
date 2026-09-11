import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Resource } from '#/entities/auth.extensions/resource.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { UpdateResourceCommand } from '#/modules/resources/commands/update-resource.command';
import { UpdateResourceResponseDto } from '#/modules/resources/dto/update-resource.dto';

@Injectable()
@CommandHandler(UpdateResourceCommand)
export class UpdateResourceHandler implements ICommandHandler<UpdateResourceCommand, UpdateResourceResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: UpdateResourceCommand): Promise<UpdateResourceResponseDto> {
    const resource = await this.identify(command.input.id);
    const input = command.input.input;
    this.verify(resource, input);

    return this.process(resource, input);
  }

  private async identify(id: string): Promise<Resource | null> {
    return this.em.findOne(Resource, { id });
  }

  private verify(resource: Resource | null, input: UpdateResourceCommand['input']['input']): asserts resource is Resource {
    if (!resource) {
      throw new ApplicationError({ code: 'RESOURCE_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }

    const actions = input.actions === undefined
      ? resource.actions
      : [...new Set(input.actions.map((action) => action.trim().toLowerCase()).filter(Boolean))];
    if (actions.length === 0) {
      throw new ApplicationError({ code: 'RESOURCE_ACTIONS_REQUIRED', status: HttpStatus.BAD_REQUEST });
    }
  }

  private process(resource: Resource, input: UpdateResourceCommand['input']['input']): UpdateResourceResponseDto {
    if (input.label !== undefined) resource.label = input.label.trim();
    if (input.description !== undefined) resource.description = input.description.trim() || null;
    if (input.actions !== undefined) resource.actions = [...new Set(input.actions.map((action) => action.trim().toLowerCase()).filter(Boolean))];
    return UpdateResourceResponseDto.fromPlain(resource);
  }
}
