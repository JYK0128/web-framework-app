import { type ClassConstructor, instanceToPlain, plainToInstance } from 'class-transformer';

export abstract class BaseDto {
  /**
   * Plain Object(JSON 객체)를 해당 DTO 클래스 인스턴스로 변환
   * (class-transformer의 @Type, @Transform, @Secret 데코레이터 재귀 적용)
   */
  static fromPlain<T>(this: ClassConstructor<T>, plain: unknown): T;
  static fromPlain<R, T = unknown>(this: ClassConstructor<T>, plain: unknown): R;
  static fromPlain(this: ClassConstructor<unknown>, plain: unknown): unknown {
    return plainToInstance(this, plain ?? {});
  }

  /**
   * 배열 형태의 Plain Object들을 해당 DTO 클래스 인스턴스 배열로 변환
   */
  static fromPlainArray<T extends BaseDto>(this: ClassConstructor<T>, plainArray: unknown[]): T[] {
    return plainToInstance(this, plainArray ?? []);
  }

  /**
   * 인스턴스를 Plain Object로 직렬화 (@Secret 마스킹 등 적용)
   */
  static toPlain(instance: object): Record<string, unknown> {
    return instanceToPlain(instance);
  }

  /**
   * 현재 인스턴스를 Plain Object로 직렬화 (@Secret 마스킹 등 적용)
   */
  toPlain?(): Record<string, unknown> {
    return instanceToPlain(this);
  }
}
