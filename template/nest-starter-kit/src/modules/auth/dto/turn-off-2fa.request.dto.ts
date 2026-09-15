import { EntityDto } from '#/common/dto/entity-dto';
import { User } from '#/entities/auth/user.entity';

export class TurnOff2FARequestDto extends EntityDto(User) {}
