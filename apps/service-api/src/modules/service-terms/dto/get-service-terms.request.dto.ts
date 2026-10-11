import { ApiSchema } from '@nestjs/swagger';

import { Term } from '#/core/database/entities/terms/term.entity';
import { PageRequestDto } from '#/core/http/dto/request/page.request.dto';

@ApiSchema({ name: 'GetServiceTermsRequest' })
export class GetServiceTermsRequestDto extends PageRequestDto<Term> {
  override get searchFields(): (keyof Term)[] { return ['version', 'content']; }
}
