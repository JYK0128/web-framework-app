import { ListRequestDto } from '#/common/interfaces';
import { Notice } from '#/entities/notices/notice.entity';

export class GetPublishedNoticesRequestDto extends ListRequestDto<Notice> {}
