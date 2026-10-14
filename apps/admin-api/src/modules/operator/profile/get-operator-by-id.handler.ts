import { HttpStatus, Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Account, User } from '#/core/database/entities/auth';
import { AppEntityManager } from '#/core/database/entity-manager';
import { GetOperatorByIdQuery } from '#/modules/operator/profile/get-operator-by-id.query';
import { GetOperatorByIdResponseDto } from '#/modules/operator/profile/get-operator-by-id.response.dto';

@Injectable()
@QueryHandler(GetOperatorByIdQuery)
export class GetOperatorByIdHandler implements IQueryHandler<GetOperatorByIdQuery, GetOperatorByIdResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetOperatorByIdQuery): Promise<GetOperatorByIdResponseDto> {
    const operator = await this.em.findOne(User, { id: query.input.operatorId }, { populate: ['role', 'profile'], filters: false });
    if (!operator) {
      throw new ApplicationError({
        code: 'OPERATOR_NOT_FOUND',
        status: HttpStatus.NOT_FOUND,
      });
    }

    const accounts = await this.em.find(Account, { user: operator.id }, { filters: false });
    return GetOperatorByIdResponseDto.parseEntity(operator, accounts);
  }
}
