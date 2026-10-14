import { ApiSchema } from '@nestjs/swagger';
import { OkResponseDto } from '@pkg/server-core/http/dto/response';

@ApiSchema({ name: 'SetServiceTermAgreementsResponse' })
export class SetServiceTermAgreementsResponseDto extends OkResponseDto {}
