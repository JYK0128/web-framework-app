import type { GetFaqsRequestDto } from '#/modules/faqs/dto';

export class GetFaqsQuery {
  constructor(public readonly query: GetFaqsRequestDto) {}
}
