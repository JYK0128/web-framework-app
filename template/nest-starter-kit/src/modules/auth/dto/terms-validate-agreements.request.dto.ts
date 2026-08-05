import { EntityType } from '#/common/dto/entity-dto';
import { User } from '#/entities/auth/user.entity';

export class TermsValidateAgreementsRequestDto extends EntityType(User) {
  userId!: string;
}
