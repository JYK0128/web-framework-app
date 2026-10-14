import { Module } from '@nestjs/common';

import { MembershipsController } from '#/modules/memberships/memberships.controller';

@Module({ controllers: [MembershipsController] })
export class MembershipsModule {}
