import type { GetFaqsRequestDto } from '#/modules/faqs/dto';

export class GetInternalFaqsQuery {
  constructor(public readonly input: GetFaqsRequestDto) {}
}
