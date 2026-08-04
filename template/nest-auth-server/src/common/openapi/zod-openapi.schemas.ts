import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';

import { openApiRegistry } from './registry';

export const zodOpenApiComponents = new OpenApiGeneratorV3(openApiRegistry.definitions).generateComponents();
