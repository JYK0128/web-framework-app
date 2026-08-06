import { applyDecorators, type Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

export const ApiOkResponseData = <TModel extends Type<unknown>>(model: TModel) => {
  return applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          statusCode: { type: 'number', example: 200 },
          path: { type: 'string', example: '/api/v1/resource' },
          requestId: { type: 'string', example: '019fd4a1-865a-7662-9024-255dd0d93563' },
          timestamp: { type: 'string', example: '2026-08-06T01:13:03.343Z' },
          data: { $ref: getSchemaPath(model) },
        },
        required: ['success', 'statusCode', 'path', 'requestId', 'timestamp', 'data'],
      },
    }),
  );
};
