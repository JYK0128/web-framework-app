import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { MACHINE_AUTH_VERIFIER, type MachineAuthVerifier } from '@pkg/server-core/auth/machine/machine-auth.interface';
import { ApplicationError } from '@pkg/shared/common';
import type { Request } from 'express';

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
