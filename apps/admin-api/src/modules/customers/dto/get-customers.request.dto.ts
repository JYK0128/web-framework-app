import { PageRequestDto } from '#/common/interfaces/request';
import type { BaseEntity } from '#/entities/common/base.entity';

export class GetCustomersRequestDto extends PageRequestDto<BaseEntity> {}
