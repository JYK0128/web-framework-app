import { Migration } from '@mikro-orm/migrations';

export class Migration20260907020000 extends Migration {
  override up(): void {
    this.addSql(`
      update "system_config"
      set "value" = jsonb_set(
        coalesce("value", '{}'::jsonb),
        '{notification,cooldownMinutes}',
        '10'::jsonb,
        true
      )
      where "key" = 'inquiry'
        and coalesce("value"->'notification'->>'cooldownMinutes', '') = '';
    `);
  }

  override down(): void {
    this.addSql(`
      update "system_config"
      set "value" = "value" #- '{notification,cooldownMinutes}'
      where "key" = 'inquiry';
    `);
  }
}
