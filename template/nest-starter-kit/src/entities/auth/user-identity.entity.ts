import type { Opt, Rel } from '@mikro-orm/core';
import { Entity, OneToOne, Property } from '@mikro-orm/decorators/legacy';

import type { Gender } from '#/common/constants/identity.constants';
import { BaseEntity } from '#/entities/common/base.entity';

import { User } from './user.entity';

@Entity({ tableName: 'user_identity' })
export class UserIdentity extends BaseEntity {
  @OneToOne(() => User, { deleteRule: 'cascade', unique: true, owner: true })
  user!: Rel<User>;

  /** 통신사 공인 실명 */
  @Property({ type: 'string', length: 120 })
  name!: string;

  /** 중복가입확인정보 (Duplication Information, 64자 고유 해시값) - 1인 1계정 중복가입 방지용 유니크 인덱스 */
  @Property({ type: 'string', unique: true, nullable: true, length: 100 })
  di: Opt<string> | null = null;

  /** 연계정보 (Connecting Information, 88자 고유 해시값) - 제휴/금융/패밀리 사이트 연계용 유니크 인덱스 */
  @Property({ type: 'string', unique: true, nullable: true, length: 120 })
  ci: Opt<string> | null = null;

  /** 생년월일 (YYYY-MM-DD) */
  @Property({ type: 'string', nullable: true, length: 20 })
  birthDate: Opt<string> | null = null;

  /** 성별 (MALE / FEMALE) */
  @Property({ type: 'string', nullable: true, length: 10 })
  gender: Opt<Gender> | null = null;

  /** 본인인증 완료 일시 */
  @Property({ type: 'timestamp' })
  verifiedAt: Opt<Date> = new Date();
}
