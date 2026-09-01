import { Inject, Injectable, type LoggerService as OriginLoggerService } from '@nestjs/common';
import { createLogger } from '@pkg/shared/common';

export const LOGGER_MODULE_OPTIONS = Symbol('LOGGER_MODULE_OPTIONS');

export interface LoggerModuleOptions {
  appName: string
}

@Injectable()
export class LoggerService implements OriginLoggerService {
  private readonly consola: ReturnType<typeof createLogger>;

  constructor(
    @Inject(LOGGER_MODULE_OPTIONS)
    options: LoggerModuleOptions,
  ) {
    this.consola = createLogger(options.appName);
  }

  log(message: unknown, ...optionalParams: unknown[]): void {
    const context = this.extractContext(optionalParams);
    const logger = context ? this.consola.withTag(context) : this.consola;

    if (optionalParams.length > 0) {
      logger.info(String(message), ...optionalParams);
    }
    else {
      logger.info(String(message));
    }
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    const context = this.extractContext(optionalParams);
    const logger = context ? this.consola.withTag(context) : this.consola;

    if (optionalParams.length > 0) {
      logger.error(String(message), ...optionalParams);
    }
    else {
      logger.error(String(message));
    }
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    const context = this.extractContext(optionalParams);
    const logger = context ? this.consola.withTag(context) : this.consola;

    if (optionalParams.length > 0) {
      logger.warn(String(message), ...optionalParams);
    }
    else {
      logger.warn(String(message));
    }
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    const context = this.extractContext(optionalParams);
    const logger = context ? this.consola.withTag(context) : this.consola;

    if (optionalParams.length > 0) {
      logger.debug(String(message), ...optionalParams);
    }
    else {
      logger.debug(String(message));
    }
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    const context = this.extractContext(optionalParams);
    const logger = context ? this.consola.withTag(context) : this.consola;

    if (optionalParams.length > 0) {
      logger.trace(String(message), ...optionalParams);
    }
    else {
      logger.trace(String(message));
    }
  }

  private extractContext(params: unknown[]): string | undefined {
    const last = params.at(-1);
    if (typeof last === 'string') {
      params.pop();
      return last;
    }
    return undefined;
  }
}
