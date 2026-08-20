import { Inject, Injectable, type LoggerService as OriginLoggerService, Optional } from '@nestjs/common';
import { createLogger } from '@pkg/shared';

export const LOGGER_MODULE_OPTIONS = Symbol('LOGGER_MODULE_OPTIONS');

export interface LoggerModuleOptions {
  tag?: string
}

@Injectable()
export class LoggerService implements OriginLoggerService {
  private readonly consola: ReturnType<typeof createLogger>;

  constructor(
    @Optional()
    @Inject(LOGGER_MODULE_OPTIONS)
    options?: LoggerModuleOptions,
  ) {
    this.consola = createLogger(options?.tag);
  }

  log(message: unknown, ...optionalParams: unknown[]): void {
    const context = typeof optionalParams.at(-1) === 'string' ? (optionalParams.pop() as string) : undefined;
    const logger = context ? this.consola.withTag(context) : this.consola;

    if (optionalParams.length > 0) {
      logger.info(String(message), ...optionalParams);
    }
    else {
      logger.info(String(message));
    }
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    const context = typeof optionalParams.at(-1) === 'string' ? (optionalParams.pop() as string) : undefined;
    const logger = context ? this.consola.withTag(context) : this.consola;

    if (optionalParams.length > 0) {
      logger.error(String(message), ...optionalParams);
    }
    else {
      logger.error(String(message));
    }
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    const context = typeof optionalParams.at(-1) === 'string' ? (optionalParams.pop() as string) : undefined;
    const logger = context ? this.consola.withTag(context) : this.consola;

    if (optionalParams.length > 0) {
      logger.warn(String(message), ...optionalParams);
    }
    else {
      logger.warn(String(message));
    }
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    const context = typeof optionalParams.at(-1) === 'string' ? (optionalParams.pop() as string) : undefined;
    const logger = context ? this.consola.withTag(context) : this.consola;

    if (optionalParams.length > 0) {
      logger.debug(String(message), ...optionalParams);
    }
    else {
      logger.debug(String(message));
    }
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    const context = typeof optionalParams.at(-1) === 'string' ? (optionalParams.pop() as string) : undefined;
    const logger = context ? this.consola.withTag(context) : this.consola;

    if (optionalParams.length > 0) {
      logger.trace(String(message), ...optionalParams);
    }
    else {
      logger.trace(String(message));
    }
  }
}
