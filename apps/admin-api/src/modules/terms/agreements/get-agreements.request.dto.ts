import { ListRequestDto } from '@pkg/server-core/http/dto/request/list.request.dto';

import { UserTermAgreement } from '#/core/database/entities/terms';

export class GetAgreementsRequestDto extends ListRequestDto<UserTermAgreement> {}
