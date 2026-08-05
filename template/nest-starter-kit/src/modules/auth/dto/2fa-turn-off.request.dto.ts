import { EntityType } from '#/common/dto/entity-dto';
import { User } from '#/entities/auth/user.entity';

export class TurnOff2FARequestDto extends EntityType(User) {}
