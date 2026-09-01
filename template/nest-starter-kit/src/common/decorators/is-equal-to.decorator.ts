import { registerDecorator, type ValidationArguments, type ValidationOptions, ValidatorConstraint, type ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'isEqualTo', async: false })
export class IsEqualToConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const [relatedPropertyName] = args.constraints as [string];
    const relatedValue = (args.object as Record<string, unknown>)[relatedPropertyName];
    return value === relatedValue;
  }

  defaultMessage(args: ValidationArguments): string {
    const [relatedPropertyName] = args.constraints as [string];
    return `${args.property} must be equal to ${relatedPropertyName}`;
  }
}

export function IsEqualTo(property: string, validationOptions?: ValidationOptions): PropertyDecorator {
  return function (object: object, propertyName: string | symbol): void {
    registerDecorator({
      name: 'isEqualTo',
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      constraints: [property],
      validator: IsEqualToConstraint,
    });
  };
}
