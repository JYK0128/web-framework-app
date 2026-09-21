import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import type { Request } from 'express';

import { MACHINE_AUTH_VERIFIER, type MachineAuthVerifier } from './machine-auth.interface';

@Injectable()
export class MachineAuthGuard implements CanActivate {
  constructor(private readonly moduleRef: ModuleRef) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const verifier = this.moduleRef.get<MachineAuthVerifier>(MACHINE_AUTH_VERIFIER, { strict: false });
    if (!verifier) throw new Error('Machine authentication verifier is not configured');
    await verifier.verify(context.switchToHttp().getRequest<Request>());
    return true;
  }
}
