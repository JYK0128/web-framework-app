import { Module } from '@nestjs/common';

import { NoticesController } from '~/modules/notice/notices.controller';

@Module({ controllers: [NoticesController] })
export class NoticesModule {}
