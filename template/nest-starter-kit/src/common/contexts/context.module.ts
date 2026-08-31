import { Global, Module } from '@nestjs/common';

import { RequestContext } from './request.context';
import { SessionContext } from './session.context';

@Global()
@Module({
  providers: [RequestContext, SessionContext],
  exports: [RequestContext, SessionContext],
})
export class ContextModule {}
