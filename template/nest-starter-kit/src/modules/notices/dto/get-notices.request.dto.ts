import { DtoType } from '#/common/dto/entity-dto';
import { Notice } from '#/entities/notices/notice.entity';

export class GetNoticesRequestDto extends DtoType(Notice) {}
