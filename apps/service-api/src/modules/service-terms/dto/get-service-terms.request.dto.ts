import { ApiSchema } from '@nestjs/swagger';
import { PageRequestDto } from '#/common/interfaces/request/page.request.dto';
import { Term } from '#/entities/terms/term.entity';

@ApiSchema({ name: 'GetServiceTermsRequest' })
export class GetServiceTermsRequestDto extends PageRequestDto<Term> {
  override get searchFields(): (keyof Term)[] { return ['version', 'content']; }
}
