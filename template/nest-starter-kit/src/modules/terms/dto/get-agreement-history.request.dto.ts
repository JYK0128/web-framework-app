import { DtoType } from '#/common/dto/entity-dto';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';

export class GetAgreementHistoryRequestDto extends DtoType(UserTermAgreement) {}
