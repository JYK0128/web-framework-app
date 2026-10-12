import type { GetPublicFaqsRequestDto } from '#/modules/faqs';

export class GetFaqsQuery {
  constructor(public readonly input: GetPublicFaqsRequestDto) {}
}
