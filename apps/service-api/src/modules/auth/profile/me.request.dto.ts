import { ApiSchema } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base/base.dto';

@ApiSchema({ name: 'MeRequest' })
export class MeRequestDto extends BaseDto {}
