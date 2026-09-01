import { CursorRequestDto } from '#/common/interfaces';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';

export class GetAgreementHistoryCursorRequestDto extends CursorRequestDto<UserTermAgreement, 'createdAt'> {
  override sort: 'createdAt'[] = ['createdAt'];
  override direction = ['desc' as const];
}
