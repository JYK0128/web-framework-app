import { HttpStatus } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import { type ClassConstructor, instanceToPlain, plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

export abstract class BaseDto {
  protected static readonly validationError: { code: string, status: number } = {
    code: 'VALIDATION_ERROR',
    status: HttpStatus.BAD_REQUEST,
  };

  static parse<T>(this: ClassConstructor<T>, plain: unknown): T {
    return plainToInstance(this, plain ?? {});
  }

  static parseArray<T extends BaseDto>(this: ClassConstructor<T>, plainArray: unknown[]): T[] {
    return plainToInstance(this, plainArray ?? []);
  }

  static toPlain(instance: object): Record<string, unknown> {
    return instanceToPlain(instance);
  }

  validate(): this {
    const errors = validateSync(this, {
      whitelist: true,
      forbidNonWhitelisted: true,
      validationError: { target: false, value: false },
    });
    if (errors.length) {
      const dtoClass = this.constructor as typeof BaseDto;
      throw new ApplicationError({ ...dtoClass.validationError, details: errors });
    }
    return this;
  }

  toPlain?(): Record<string, unknown> {
    return instanceToPlain(this);
  }
}
