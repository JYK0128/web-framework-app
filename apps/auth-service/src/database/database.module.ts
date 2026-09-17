import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Global, Module } from '@nestjs/common';

import mikroOrmConfig from './mikro-orm.config.js';

@Global()
@Module({
  imports: [MikroOrmModule.forRoot(mikroOrmConfig)],
  exports: [MikroOrmModule],
})
export class DatabaseModule {}
