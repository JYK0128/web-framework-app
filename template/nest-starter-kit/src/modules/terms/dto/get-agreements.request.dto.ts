import { ListRequestDto } from '#/common/interfaces';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';

export class GetAgreementsRequestDto extends ListRequestDto<UserTermAgreement> {}
