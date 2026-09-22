import type { GetFaqsRequestDto } from '../dto';

export class GetFaqsQuery {
  constructor(public readonly input: GetFaqsRequestDto) {}
}
