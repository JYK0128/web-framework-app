import { HttpException, HttpStatus } from '@nestjs/common';

export class ApplicationException extends HttpException {
  constructor(code: string, message: string, status: number = HttpStatus.BAD_REQUEST, details?: unknown) {
    super({
      code,
      message,
      ...(details === undefined ? {} : { details }),
    }, status);
  }
}
