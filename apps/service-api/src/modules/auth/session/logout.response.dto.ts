import { ApiSchema } from '@nestjs/swagger';
import { OkResponseDto } from '@pkg/server-core/http/dto/response';

@ApiSchema({ name: 'LogoutResponse' })
export class LogoutResponseDto extends OkResponseDto {}
