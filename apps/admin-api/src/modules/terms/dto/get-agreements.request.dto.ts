import { UserTermAgreement } from '#/core/database/entities/terms/user-term-agreement.entity';
import { ListRequestDto } from '#/core/http/dto/request/list.request.dto';

export class GetAgreementsRequestDto extends ListRequestDto<UserTermAgreement> {}
