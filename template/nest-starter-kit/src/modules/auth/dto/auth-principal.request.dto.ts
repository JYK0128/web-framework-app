import { EntityDto } from '#/common/dto/entity-dto';
import { User } from '#/entities/auth/user.entity';

export class AuthPrincipalRequestDto extends EntityDto(User) {}
