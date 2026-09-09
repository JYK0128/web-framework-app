import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Role, type RolePermissions } from '#/entities/auth.extentions/role.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { CreateRoleCommand } from '#/modules/roles/commands/create-role.command';
import { type CreateRoleRequestDto, CreateRoleResponseDto } from '#/modules/roles/dto';

@Injectable()
@CommandHandler(CreateRoleCommand)
export class CreateRoleHandler implements ICommandHandler<CreateRoleCommand, CreateRoleResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: CreateRoleCommand): Promise<CreateRoleResponseDto> {
    const input = this.identify(command);
    const initialPermissions = await this.identifyInitialPermissions(input);
    await this.verify(input);
    return this.process(input, initialPermissions);
  }

  private identify(command: CreateRoleCommand): CreateRoleRequestDto {
    return command.input;
  }

  private async verifyKeyUnique(key: string): Promise<void> {
    const existing = await this.em.findOne(Role, { key });
    if (existing) {
      throw new ApplicationError({
        code: 'ROLE_KEY_ALREADY_EXISTS',
        message: '이미 존재하는 역할 코드입니다.',
        status: HttpStatus.CONFLICT,
      });
    }
  }

  private async verify(input: CreateRoleRequestDto): Promise<void> {
    await this.verifyKeyUnique(input.key);
  }

  private async identifyInitialPermissions(input: CreateRoleRequestDto): Promise<RolePermissions> {
    if (input.copyFromRoleId) {
      const sourceRole = await this.em.findOne(Role, { id: input.copyFromRoleId });
      if (sourceRole?.permissions) {
        return JSON.parse(JSON.stringify(sourceRole.permissions)) as RolePermissions;
      }
    }
    return input.permissions ?? {};
  }

  private process(input: CreateRoleRequestDto, permissions: RolePermissions): CreateRoleResponseDto {
    const role = this.em.create(Role, {
      key: input.key.trim().toLowerCase(),
      label: input.label.trim(),
      description: input.description?.trim() || null,
      isSystem: false,
      permissions,
    });

    this.em.persist(role);
    return new CreateRoleResponseDto(role, 0);
  }
}
