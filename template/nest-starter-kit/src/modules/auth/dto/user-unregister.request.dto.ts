import { EntityDto } from '#/common/dto/entity-dto';
import { User } from '#/entities/auth/user.entity';

export class UserUnregisterRequestDto extends EntityDto(User) {}
