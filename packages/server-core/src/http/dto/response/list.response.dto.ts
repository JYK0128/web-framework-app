import { BaseDto } from '#http/dto/base/base.dto';

export abstract class ListResponseDto<TEntity extends object> extends BaseDto {
  abstract items: TEntity[];
}
