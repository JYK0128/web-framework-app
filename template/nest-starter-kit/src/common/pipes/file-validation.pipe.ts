import { FileValidator, HttpStatus, MaxFileSizeValidator, ParseFilePipe } from '@nestjs/common';
import { ApplicationError, isForbiddenExtension, MAX_FILE_SIZE } from '@pkg/shared/common';
import type { Express } from 'express';

export type CreateFilePipeOptions = {
  /** 최대 파일 크기 (바이트 단위, 기본값: MAX_FILE_SIZE = 10MB) */
  maxSize?: number
  /** 추가로 허용할 MIME 타입 정규식 또는 문자열 목록 (예: ['image/jpeg', 'image/png'] 또는 /^image\\//) */
  allowedMimeTypes?: (string | RegExp)[]
  /** 추가로 허용할 확장자 목록 */
  allowedExtensions?: string[]
  /** 파일 필수 여부 (기본값: true) */
  required?: boolean
};

/**
 * 🔒 위험 실행 파일 확장자 (.exe, .sh, .bat, .php 등) 차단 Validator
 */
export class ForbiddenExtensionValidator extends FileValidator<{ allowedExtensions?: string[] }> {
  isValid(file?: Express.Multer.File): boolean {
    if (!file) return true;

    // 1. 공용 SSOT 금지 확장자 차단
    if (isForbiddenExtension(file.originalname)) return false;

    // 2. 화이트리스트가 주어진 경우 검증
    if (this.validationOptions.allowedExtensions?.length) {
      const allowedSet = new Set(this.validationOptions.allowedExtensions.map((e) => e.replace(/^\./, '').toLowerCase()));
      const ext = file.originalname.split('.').pop()?.toLowerCase() ?? '';
      return allowedSet.has(ext);
    }

    return true;
  }

  buildErrorMessage(file: Express.Multer.File): string {
    const ext = file.originalname.split('.').pop()?.toLowerCase() ?? '';
    return `보안상 허용되지 않거나 위험한 파일 형식입니다 (.${ext})`;
  }
}

/**
 * 🔒 MIME 타입 검증 Validator
 */
export class AllowedMimeTypeValidator extends FileValidator<{ allowedMimeTypes: (string | RegExp)[] }> {
  isValid(file?: Express.Multer.File): boolean {
    if (!file || !this.validationOptions.allowedMimeTypes || this.validationOptions.allowedMimeTypes.length === 0) {
      return true;
    }

    const mime = file.mimetype.toLowerCase();
    return this.validationOptions.allowedMimeTypes.some((allowed) => {
      if (typeof allowed === 'string') return allowed.toLowerCase() === mime;
      return allowed.test(mime);
    });
  }

  buildErrorMessage(file: Express.Multer.File): string {
    return `지원하지 않는 파일 형식(MIME)입니다 (${file.mimetype})`;
  }
}

/**
 * 🔒 NestJS 표준 기반 안전한 File Validation Pipe 팩토리
 *
 * - 크기 제한 (기본 10MB = MAX_FILE_SIZE)
 * - 악성 실행 확장자 원천 차단 (SSOT)
 * - MIME 타입 검증 지원
 * - 실패 시 표준 ApplicationError(FILE_VALIDATION_ERROR) 발생
 */
export function createFilePipe(options?: CreateFilePipeOptions): ParseFilePipe {
  const maxSize = options?.maxSize ?? MAX_FILE_SIZE;
  const maxSizeMb = Math.round(maxSize / (1024 * 1024));

  const validators: FileValidator[] = [
    new MaxFileSizeValidator({
      maxSize,
      message: `파일 크기는 최대 ${maxSizeMb}MB까지 가능합니다.`,
    }),
    new ForbiddenExtensionValidator({
      allowedExtensions: options?.allowedExtensions,
    }),
  ];

  if (options?.allowedMimeTypes && options.allowedMimeTypes.length > 0) {
    validators.push(new AllowedMimeTypeValidator({
      allowedMimeTypes: options.allowedMimeTypes,
    }));
  }

  return new ParseFilePipe({
    validators,
    fileIsRequired: options?.required ?? true,
    errorHttpStatusCode: HttpStatus.BAD_REQUEST,
    exceptionFactory: (error) =>
      new ApplicationError({
        code: 'FILE_VALIDATION_ERROR',
        status: HttpStatus.BAD_REQUEST,
        message: typeof error === 'string' ? error : '파일 유효성 검사에 실패했습니다.',
      }),
  });
}
