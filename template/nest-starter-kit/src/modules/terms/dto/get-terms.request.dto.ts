import { DtoType } from '#/common/dto/entity-dto';
import { Term } from '#/entities/terms/term.entity';

export class GetTermsRequestDto extends DtoType(Term) {}
