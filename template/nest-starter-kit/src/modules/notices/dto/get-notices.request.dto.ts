import { ListRequestDto } from '#/common/interfaces';
import { Notice } from '#/entities/notices/notice.entity';

export class GetNoticesRequestDto extends ListRequestDto<Notice> {}
