import { Inject, Injectable, Optional } from '@nestjs/common';

import { PUBLIC_CONFIG_CONTRIBUTORS, type PublicConfigContributor } from './public-config-contributor.interface';

@Injectable()
export class PublicConfigRegistry {
  private readonly contributors = new Map<string, PublicConfigContributor>();

  constructor(
    @Optional()
    @Inject(PUBLIC_CONFIG_CONTRIBUTORS)
    contributors?: PublicConfigContributor[],
  ) {
    if (contributors) {
      for (const contributor of contributors) {
        this.register(contributor);
      }
    }
  }

  /**
   * 새로운 공개 설정 Contributor 등록
   */
  register(contributor: PublicConfigContributor): this {
    this.contributors.set(contributor.key, contributor);
    return this;
  }

  /**
   * 등록된 Contributor 제거
   */
  unregister(key: string): boolean {
    return this.contributors.delete(key);
  }

  /**
   * 특정 키의 Contributor 조회
   */
  get(key: string): PublicConfigContributor | undefined {
    return this.contributors.get(key);
  }

  /**
   * 등록된 전체 Contributor 목록 반환
   */
  getAll(): PublicConfigContributor[] {
    return Array.from(this.contributors.values());
  }
}
