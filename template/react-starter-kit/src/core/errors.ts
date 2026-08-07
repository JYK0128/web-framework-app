import { ApplicationError } from '@pkg/shared/common';

import type { ApiErrorResponseDto } from '#/.generated/api/model';

export type ApiValidationErrorDetail = NonNullable<ApiErrorResponseDto['details']>[number];

export function isApplicationError(error: unknown): error is ApplicationError {
  return error instanceof ApplicationError;
}

export function getValidationErrorDetails(error: unknown): ApiValidationErrorDetail[] {
  if (!isApplicationError(error) || error.code !== 'VALIDATION_ERROR' || !Array.isArray(error.details)) {
    return [];
  }

  return error.details as ApiValidationErrorDetail[];
}
