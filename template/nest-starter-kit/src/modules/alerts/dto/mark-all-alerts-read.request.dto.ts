import { DtoType } from '#/common/dto/entity-dto';
import { Alert } from '#/entities/alerts/alert.entity';

export class MarkAllAlertsReadRequestDto extends DtoType(Alert) {}
