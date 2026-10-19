import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ApplicationError } from '@pkg/shared/common';
import type { Request } from 'express';

import { MACHINE_AUTH_VERIFIER, type MachineAuthVerifier } from '#auth/machine/machine-auth.interface';

@Injectable()
export class MachineAuthGuard implements CanActivate {
  constructor(private readonly moduleRef: ModuleRef) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const verifier = this.moduleRef.get<MachineAuthVerifier>(MACHINE_AUTH_VERIFIER, { strict: false });
    if (!verifier) throw new ApplicationError({ code: 'INTERNAL_SERVER_ERROR', status: HttpStatus.INTERNAL_SERVER_ERROR });
    await verifier.verify(context.switchToHttp().getRequest<Request>());
    return true;
  }
}
