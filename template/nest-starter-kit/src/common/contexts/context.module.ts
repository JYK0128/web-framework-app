import { Global, Module } from '@nestjs/common';

import { RequestContext } from './request.context';
import { SessionContext } from './session.context';
import { SystemContext } from './system.context';

@Global()
@Module({
  providers: [RequestContext, SessionContext, SystemContext],
  exports: [RequestContext, SessionContext, SystemContext],
})
export class ContextModule {}
