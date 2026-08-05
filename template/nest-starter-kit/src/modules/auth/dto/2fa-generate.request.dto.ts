import { EntityType } from '#/common/dto/entity-dto';
import { User } from '#/entities/auth/user.entity';

export class Generate2FARequestDto extends EntityType(User) {}
