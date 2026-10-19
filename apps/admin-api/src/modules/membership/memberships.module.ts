import { Module } from '@nestjs/common';

import { MembershipsController } from '#/modules/membership/memberships.controller';

@Module({ controllers: [MembershipsController] })
export class MembershipsModule {}
