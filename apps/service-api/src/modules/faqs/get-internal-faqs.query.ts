import type { GetFaqsRequestDto } from '#/modules/faqs';

export class GetInternalFaqsQuery {
  constructor(public readonly input: GetFaqsRequestDto) {}
}
