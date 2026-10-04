import { type ClassConstructor, instanceToPlain, plainToInstance } from 'class-transformer';

export abstract class BaseDto {
  static fromPlain<T>(this: ClassConstructor<T>, plain: unknown): T;
  static fromPlain<R, T = unknown>(this: ClassConstructor<T>, plain: unknown): R;
  static fromPlain(this: ClassConstructor<unknown>, plain: unknown): unknown {
    return plainToInstance(this, plain ?? {});
  }

  static fromPlainArray<T extends BaseDto>(this: ClassConstructor<T>, plainArray: unknown[]): T[] {
    return plainToInstance(this, plainArray ?? []);
  }

  static toPlain(instance: object): Record<string, unknown> {
    return instanceToPlain(instance);
  }

  toPlain?(): Record<string, unknown> {
    return instanceToPlain(this);
  }
}
