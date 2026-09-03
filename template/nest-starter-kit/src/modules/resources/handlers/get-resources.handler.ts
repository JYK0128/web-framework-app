import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Resource } from '#/entities/auth.extentions/resource.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { GetResourcesResponseDto, ResourceDto } from '#/modules/resources/dto';
import { GetResourcesQuery } from '#/modules/resources/queries';

@Injectable()
@QueryHandler(GetResourcesQuery)
export class GetResourcesHandler implements IQueryHandler<GetResourcesQuery, GetResourcesResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(_query: GetResourcesQuery): Promise<GetResourcesResponseDto> {
    const resources = await this.identifyResources();
    return this.process(resources);
  }

  private async identifyResources(): Promise<Resource[]> {
    return this.em.find(Resource, {}, {
      orderBy: [
        { sortOrder: 'ASC' },
        { createdAt: 'ASC' },
      ],
    });
  }

  private process(resources: Resource[]): GetResourcesResponseDto {
    const dtos = resources.map((r) => new ResourceDto(r));
    return {
      items: dtos,
      resources: dtos,
    };
  }
}
