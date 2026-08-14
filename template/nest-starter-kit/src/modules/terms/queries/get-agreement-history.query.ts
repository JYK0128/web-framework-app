import { Query } from '@nestjs/cqrs';

import { GetAgreementHistoryResponseDto } from '#/modules/terms/dto/get-agreement-history.response.dto';

export class GetAgreementHistoryQuery extends Query<GetAgreementHistoryResponseDto> {}
