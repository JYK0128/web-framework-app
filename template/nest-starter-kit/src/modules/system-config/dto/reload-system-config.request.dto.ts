import { EntityDto } from '#/common/dto/entity-dto';
import { SystemConfig } from '#/entities/system-config/system-config.entity';

export class ReloadSystemConfigRequestDto extends EntityDto(SystemConfig) {}
