import { ListRequestDto } from '#/common/interfaces';
import { Term } from '#/entities/terms/term.entity';

export class GetTermsRequestDto extends ListRequestDto<Term> {}
