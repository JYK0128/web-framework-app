import { EntityDto } from '#/common/dto/entity-dto';
import { SystemConfig } from '#/entities/system-configs/system-config.entity';

export class GetAdminSystemConfigRequestDto extends EntityDto(SystemConfig) {}
