import { applyDecorators, HttpStatus, type Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

import { API_PREFIX } from '#/common/configs/app.config';

export const SwaggerApiResponse = <TModel extends Type<unknown>>(
  model: TModel,
  statusCode = HttpStatus.OK,
) => applyDecorators(
  ApiExtraModels(model),
  ApiResponse({
    status: statusCode,
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: statusCode },
        path: { type: 'string', example: `/${API_PREFIX}/resource` },
        requestId: { type: 'string', example: '019fd4a1-865a-7662-9024-255dd0d93563' },
        timestamp: { type: 'string', example: '2026-08-06T01:13:03.343Z' },
        data: { $ref: getSchemaPath(model) },
        message: { type: 'string', example: '처리가 완료되었습니다.' },
        meta: { type: 'object', additionalProperties: true },
      },
      required: ['success', 'statusCode', 'path', 'requestId', 'timestamp', 'data'],
    },
  }),
);
