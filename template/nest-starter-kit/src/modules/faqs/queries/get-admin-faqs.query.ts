import type { GetAdminFaqsRequestDto } from '#/modules/faqs/dto';

export class GetAdminFaqsQuery {
  constructor(public readonly query: GetAdminFaqsRequestDto) {}
}
