import { DtoType } from '#/common/dto/entity-dto';
import { SystemConfig } from '#/entities/system-config/system-config.entity';

export class GetSystemConfigRequestDto extends DtoType(SystemConfig) {}
