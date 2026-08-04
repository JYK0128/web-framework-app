import { type Type } from '@nestjs/common';
import { IntersectionType, PartialType } from '@nestjs/swagger';

type UnionToIntersection<T> = (T extends unknown ? (value: T) => void : never) extends ((value: infer I) => void) ? I : never;
type EntityTypeResult<T extends readonly Type<object>[]> = Partial<UnionToIntersection<InstanceType<T[number]>>>;

function clearEntityInitializers(instance: object): void {
  for (const key of Object.keys(instance)) {
    Reflect.deleteProperty(instance, key);
  }
}

export function EntityType<T extends readonly Type<object>[]>(...classRefs: T): Type<EntityTypeResult<T>> {
  const partialTypes = classRefs.map((classRef) => PartialType(classRef));
  const intersectedType = IntersectionType(...partialTypes);

  return class EntityDto extends (intersectedType as Type<object>) {
    constructor() {
      // Mapped types return runtime-generated classes that ESLint cannot statically resolve.
      super();
      clearEntityInitializers(this);
    }
  } as Type<EntityTypeResult<T>>;
}
