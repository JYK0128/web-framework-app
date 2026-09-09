import { EntityDto } from '#/common/dto/entity-dto';
import { Alert } from '#/entities/alerts/alert.entity';

export class MarkAllAlertsReadRequestDto extends EntityDto(Alert) {}
