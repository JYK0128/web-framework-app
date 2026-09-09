import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Resource } from '#/entities/auth.extentions/resource.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { CreateResourceCommand } from '#/modules/resources/commands/create-resource.command';
import { CreateResourceResponseDto } from '#/modules/resources/dto';

@Injectable()
@CommandHandler(CreateResourceCommand)
export class CreateResourceHandler implements ICommandHandler<CreateResourceCommand, CreateResourceResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: CreateResourceCommand): Promise<CreateResourceResponseDto> {
    const input = this.identify(command);
    await this.verify(input);
    return this.process(input);
  }

  private identify(command: CreateResourceCommand): CreateResourceCommand['input'] {
    return {
      ...command.input,
      key: command.input.key.trim().toLowerCase(),
      actions: [...new Set(command.input.actions.map((action) => action.trim().toLowerCase()).filter(Boolean))],
    };
  }

  private async verify(input: CreateResourceCommand['input']): Promise<void> {
    const { key, actions } = input;
    if (actions.length === 0) {
      throw new ApplicationError({ code: 'RESOURCE_ACTIONS_REQUIRED', status: HttpStatus.BAD_REQUEST });
    }
    const existing = await this.em.findOne(Resource, { key });
    if (existing) {
      throw new ApplicationError({
        code: 'RESOURCE_KEY_ALREADY_EXISTS',
        message: '이미 존재하는 리소스 코드입니다.',
        status: HttpStatus.CONFLICT,
      });
    }
  }

  private process(input: CreateResourceCommand['input']): CreateResourceResponseDto {
    const resource = this.em.create(Resource, {
      key: input.key,
      label: input.label.trim(),
      description: input.description?.trim() || null,
      actions: input.actions,
    });
    this.em.persist(resource);
    return new CreateResourceResponseDto(resource);
  }
}
