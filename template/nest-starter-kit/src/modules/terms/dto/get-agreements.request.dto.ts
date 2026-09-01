import { DtoType } from '#/common/dto/entity-dto';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';

export class GetAgreementsRequestDto extends DtoType(UserTermAgreement) {}
