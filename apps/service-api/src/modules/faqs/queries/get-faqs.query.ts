import type { GetPublicFaqsRequestDto } from '#/modules/faqs/dto';

export class GetFaqsQuery {
  constructor(public readonly input: GetPublicFaqsRequestDto) {}
}
