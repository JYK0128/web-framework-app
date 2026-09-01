import { DtoType } from '#/common/dto/entity-dto';
import { NoticeRead } from '#/entities/notices/notice-read.entity';

export class MarkAllNoticesReadRequestDto extends DtoType(NoticeRead) {}
