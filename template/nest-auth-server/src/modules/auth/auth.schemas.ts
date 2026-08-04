import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { openApiRegistry } from '#/common/openapi/registry';

extendZodWithOpenApi(z);

const passwordSchema = z.string().min(12).max(128);

export const registerSchema = z.object({
  email: z.email(),
  password: passwordSchema,
  name: z.string().trim().min(1).max(120),
});

export const loginSchema = z.object({
  email: z.email(),
  password: passwordSchema,
});

openApiRegistry.register('RegisterRequest', registerSchema);
openApiRegistry.register('LoginRequest', loginSchema);

export const registerRequestSchemaRef = {
  $ref: '#/components/schemas/RegisterRequest',
} as const;

export const loginRequestSchemaRef = {
  $ref: '#/components/schemas/LoginRequest',
} as const;

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
