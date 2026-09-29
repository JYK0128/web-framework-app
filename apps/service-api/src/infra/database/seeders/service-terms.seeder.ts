import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

import { Term } from '#/entities/terms/term.entity';
import { TermGroup } from '#/entities/terms/term-group.entity';

const SERVICE_TERM_SEEDS = [
  {
    title: '서비스 이용약관',
    isRequired: true,
    sortOrder: 1,
    content: `제1조 (목적)
이 약관은 서비스의 이용과 관련하여 서비스 운영자와 이용자 사이의 권리, 의무 및 책임사항을 정하는 것을 목적으로 합니다.

제2조 (서비스 이용)
이용자는 관련 법령과 이 약관을 준수하여 서비스를 이용해야 합니다. 운영자는 안정적인 서비스 제공을 위해 필요한 범위에서 서비스의 내용을 변경하거나 운영을 일시 중단할 수 있습니다.

제3조 (이용자의 의무)
이용자는 타인의 정보를 도용하거나 서비스 운영을 방해하는 행위를 해서는 안 됩니다.

※ 본 문안은 개발·데모용 기본 약관이며, 실제 서비스 제공 전 법률 검토가 필요합니다.`,
  },
  {
    title: '개인정보 처리방침',
    isRequired: true,
    sortOrder: 2,
    content: `서비스 운영자는 서비스 제공에 필요한 최소한의 개인정보를 수집하고, 수집 목적의 범위에서 안전하게 이용합니다.

수집한 개인정보는 이용 목적이 달성되거나 보관 기간이 지나면 지체 없이 파기합니다. 이용자는 관계 법령에 따라 자신의 개인정보에 대한 열람, 정정, 삭제 및 처리정지를 요청할 수 있습니다.

개인정보의 수집 항목, 이용 목적, 보관 기간 및 제3자 제공 여부는 실제 서비스의 운영 정책에 따라 별도로 고지합니다.

※ 본 문안은 개발·데모용 기본 개인정보 처리방침이며, 실제 수집 항목과 법적 고지사항에 맞게 수정해야 합니다.`,
  },
  {
    title: '마케팅 정보 수신 동의',
    isRequired: false,
    sortOrder: 3,
    content: `서비스 운영자는 이용자의 동의가 있는 경우 이벤트, 혜택 및 신규 기능 안내 등 마케팅 정보를 전자적 방법으로 발송할 수 있습니다.

이용자는 언제든지 마케팅 정보 수신 동의를 철회할 수 있으며, 동의 철회는 서비스 이용에 영향을 주지 않습니다.

※ 본 문안은 개발·데모용 기본 동의 문안이며, 실제 발송 채널과 철회 방법에 맞게 수정해야 합니다.`,
  },
] as const;

export class ServiceTermsSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    for (const input of SERVICE_TERM_SEEDS) {
      let group = await em.findOne(TermGroup, { title: input.title });
      if (!group) {
        group = em.create(TermGroup, {
          title: input.title,
          isRequired: input.isRequired,
          sortOrder: input.sortOrder,
        });
        em.persist(group);
      }

      const existingTerm = await em.findOne(Term, { termGroup: group, version: '1.0' });
      if (existingTerm) {
        if (existingTerm.content === '서비스 이용에 필요한 기본 약관입니다.') {
          existingTerm.content = input.content;
          existingTerm.summary = `${input.title} 최초 버전`;
        }
        continue;
      }

      em.persist(em.create(Term, {
        termGroup: group,
        version: '1.0',
        content: input.content,
        reason: '초기 약관 등록',
        summary: `${input.title} 최초 버전`,
        isNoticeRequired: false,
        publishedAt: new Date(),
      }));
    }

    await em.flush();
  }
}
