import { BaseDto } from '#/common/dto/base.dto';

export abstract class ListResponseDto<TEntity extends object> extends BaseDto {
  abstract items: TEntity[];
}
