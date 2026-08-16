import { PageRequestDto } from '#/common/interfaces';
import { Notice } from '#/entities/notices/notice.entity';

export class GetAdminNoticesRequestDto extends PageRequestDto<Notice> {
  override get searchFields(): (keyof Notice)[] {
    return ['title', 'content'];
  }
}
