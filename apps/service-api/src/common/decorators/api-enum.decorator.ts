import { ApiProperty, type ApiPropertyOptions } from '@nestjs/swagger';

import { getEnumName } from '#/common/dto/enum';

export type ApiEnumOptions = Omit<ApiPropertyOptions, 'required'> & {
  required?: boolean
  enum?: unknown
  enumName?: string
};

/**
 * Enhanced ApiProperty decorator that automatically extracts `enumName` from a `defineEnum` object
 * or single-entry shorthand object ({ EnumName }).
 *
 * @example
 * @ApiEnum({ enum: RoleKey, example: RoleKey.USER })
 * override name!: RoleKey;
 */
export function ApiEnum(options: ApiEnumOptions = {}): PropertyDecorator {
  let enumObj = options.enum;
  let enumName = options.enumName;

  if (enumObj && typeof enumObj === 'object') {
    // 1. defineEnum symbol metadata check
    const definedName = getEnumName(enumObj);
    if (definedName) {
      enumName = enumName ?? definedName;
    }
    // 2. Shorthand wrapper check ({ RoleKey })
    else if (!Array.isArray(enumObj) && Object.keys(enumObj).length === 1) {
      const entry = Object.entries(enumObj as Record<string, unknown>)[0];
      if (entry) {
        const [key, value] = entry;
        if (value && typeof value === 'object') {
          enumName = enumName ?? key;
          enumObj = value;
        }
      }
    }
  }

  return ApiProperty({
    ...options,
    enum: enumObj as object,
    enumName,
  } as ApiPropertyOptions);
}

/**
 * Optional variant of ApiEnum (@ApiPropertyOptional counterpart).
 *
 * @example
 * @ApiEnumOptional({ enum: NoticePriority, default: NoticePriority.LOW })
 * override priority?: NoticePriority;
 */
export function ApiEnumOptional(options: ApiEnumOptions = {}): PropertyDecorator {
  return ApiEnum({
    ...options,
    required: false,
  });
}
