import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Resource } from '#/entities/auth.extensions/resource.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { GetResourcesResponseDto } from '#/modules/resources/dto';
import { GetResourcesQuery } from '#/modules/resources/queries';

@Injectable()
@QueryHandler(GetResourcesQuery)
export class GetResourcesHandler implements IQueryHandler<GetResourcesQuery, GetResourcesResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(_query: GetResourcesQuery): Promise<GetResourcesResponseDto> {
    const resources = await this.identifyResources();
    this.verify(resources);
    return this.process(resources);
  }

  private verify(resources: Resource[]): void {
    if (!Array.isArray(resources)) {
      throw new Error('리소스 목록을 확인할 수 없습니다.');
    }
  }

  private async identifyResources(): Promise<Resource[]> {
    return this.em.find(Resource, {}, {
      orderBy: [
        { createdAt: 'ASC' },
      ],
    });
  }

  private process(resources: Resource[]): GetResourcesResponseDto {
    return GetResourcesResponseDto.fromPlain({ items: resources });
  }
}
