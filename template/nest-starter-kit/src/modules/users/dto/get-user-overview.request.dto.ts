import { DtoType } from '#/common/dto/entity-dto';
import { User } from '#/entities/auth/user.entity';

export class GetUserOverviewRequestDto extends DtoType(User) {}
