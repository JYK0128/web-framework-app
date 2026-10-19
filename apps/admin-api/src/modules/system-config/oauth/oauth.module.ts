import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CreateOAuthIconPresignedUrlHandler } from '#/modules/system-config/oauth/create-oauth-icon-presigned-url.handler';
import { SystemConfigOAuthController } from '#/modules/system-config/oauth/oauth.controller';

@Module({ imports: [CqrsModule], controllers: [SystemConfigOAuthController], providers: [CreateOAuthIconPresignedUrlHandler] })
export class SystemConfigOAuthModule {}
