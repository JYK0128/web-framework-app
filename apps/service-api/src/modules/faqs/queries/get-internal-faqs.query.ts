import type { GetFaqsRequestDto } from '../dto';

export class GetInternalFaqsQuery {
  constructor(public readonly input: GetFaqsRequestDto) {}
}
