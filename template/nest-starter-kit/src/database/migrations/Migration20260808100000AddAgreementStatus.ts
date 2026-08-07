import { Migration } from '@mikro-orm/migrations';

export class Migration20260808100000AddAgreementStatus extends Migration {
  override up(): void | Promise<void> {
    // 기존 이력은 동의로 초기화합니다.
    this.addSql(
      'alter table `user_term_agreement` add column `isAgreed` integer not null default true;',
    );
    this.addSql(
      'alter table `user_term_agreement` drop column `agreedAt`;',
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      'alter table `user_term_agreement` add column `agreedAt` datetime not null default \'1970-01-01 00:00:00\';',
    );
    this.addSql(
      'update `user_term_agreement` set `agreedAt` = `createdAt`;',
    );
    this.addSql(
      'alter table `user_term_agreement` drop column `isAgreed`;',
    );
  }
}
