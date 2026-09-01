import { registerDecorator, type ValidationArguments, type ValidationOptions, ValidatorConstraint, type ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'isNotEqualTo', async: false })
export class IsNotEqualToConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const [relatedPropertyName] = args.constraints as [string];
    const relatedValue = (args.object as Record<string, unknown>)[relatedPropertyName];
    return value !== relatedValue;
  }

  defaultMessage(args: ValidationArguments): string {
    const [relatedPropertyName] = args.constraints as [string];
    return `${args.property} must not be equal to ${relatedPropertyName}`;
  }
}

export function IsNotEqualTo(property: string, validationOptions?: ValidationOptions): PropertyDecorator {
  return function (object: object, propertyName: string | symbol): void {
    registerDecorator({
      name: 'isNotEqualTo',
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      constraints: [property],
      validator: IsNotEqualToConstraint,
    });
  };
}
