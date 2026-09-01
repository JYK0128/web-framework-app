export abstract class ListResponseDto<TEntity extends object> {
  abstract items: TEntity[];
}
