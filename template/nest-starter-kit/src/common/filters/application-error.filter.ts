import { ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import type { TFunction } from '@pkg/shared/server';
import { getMetadataStorage, type ValidationError } from 'class-validator';
import type { Request, Response } from 'express';

import { ApiErrorResponseDto, ApiResponse } from '#/common/dto/api-response.dto';

type RequestWithI18n = Request & { t: TFunction };
interface ValidationMessageInfo {
  source: string
  params?: Record<string, unknown>
}

type ValidationMessageTranslator = (info: ValidationMessageInfo) => string;

@Catch(ApplicationError)
export class ApplicationErrorFilter implements ExceptionFilter<ApplicationError> {
  catch(exception: ApplicationError, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<RequestWithI18n>();
    const response = http.getResponse<Response>();
    const statusCode = exception.status ?? HttpStatus.BAD_REQUEST;
    const messageKey = `error.${exception.code}`;
    const message = request.t(messageKey, exception.params);
    const details = exception.code === 'VALIDATION_ERROR'
      ? this.translateValidationErrors(exception.details, ({ source, params }) => request.t(source, params))
      : exception.details;

    const body: ApiErrorResponseDto = {
      ...ApiResponse.error({ errorCode: exception.code, message, details, statusCode }),
      statusCode,
      path: request.originalUrl,
      requestId: request.requestId ?? '-',
      timestamp: new Date().toISOString(),
    };

    response.status(statusCode).json(body);
  }

  private translateValidationErrors(
    details: unknown,
    translate: ValidationMessageTranslator,
  ): unknown {
    if (!Array.isArray(details)) return details;

    return details.map((detail) => {
      if (!this.isValidationError(detail)) return detail;

      const constraints = detail.constraints
        ? Object.fromEntries(
          Object.keys(detail.constraints).map((constraintCode) => [
            constraintCode,
            translate({
              source: `validation.${constraintCode}`,
              params: this.getValidationParams(detail, constraintCode),
            }),
          ]),
        )
        : undefined;
      const responseDetail = { ...detail };

      delete responseDetail.target;
      delete responseDetail.value;

      return {
        ...responseDetail,
        ...(detail.constraints ? { constraints } : {}),
        ...(detail.children?.length
          ? { children: this.translateValidationErrors(detail.children, translate) }
          : {}),
      };
    });
  }

  private isValidationError(value: unknown): value is ValidationError {
    return Boolean(
      value
      && typeof value === 'object'
      && 'property' in value
      && typeof value.property === 'string',
    );
  }

  private getValidationParams(
    error: ValidationError,
    constraintCode: string,
  ): Record<string, unknown> | undefined {
    const targetConstructor = error.target?.constructor;
    if (typeof targetConstructor !== 'function') return undefined;

    const metadata = getMetadataStorage()
      .getTargetValidationMetadatas(targetConstructor, '', false, false)
      .find((item) => (
        item.propertyName === error.property
        && (item.name === constraintCode || item.type === constraintCode)
      ));

    return metadata?.constraints?.length
      ? { constraints: metadata.constraints }
      : undefined;
  }
}
