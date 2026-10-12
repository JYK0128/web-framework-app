import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CreateOAuthIconPresignedUrlHandler } from './create-oauth-icon-presigned-url.handler';
import { SystemConfigOAuthController } from './oauth.controller';

@Module({ imports: [CqrsModule], controllers: [SystemConfigOAuthController], providers: [CreateOAuthIconPresignedUrlHandler] })
export class SystemConfigOAuthModule {}
