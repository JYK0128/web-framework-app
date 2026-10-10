import { ListRequestDto } from '#/common/dto/request';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';

export class GetAgreementsRequestDto extends ListRequestDto<UserTermAgreement> {}
