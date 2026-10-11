import { UserTermAgreement } from '#/core/database/entities/terms/user-term-agreement.entity';
import { ListRequestDto } from '#/core/http/dto/request';

export class GetAgreementsRequestDto extends ListRequestDto<UserTermAgreement> {}
