import { Migration } from '@mikro-orm/migrations';

export class Migration20260826000000 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`
      update "system_config" as scheduled
      set
        "key" = 'maintenance',
        "value" = jsonb_build_object(
          'enabled',
            coalesce((emergency."value"->>'enabled')::boolean, false)
            or coalesce((scheduled."value"->>'enabled')::boolean, false),
          'message', coalesce(emergency."value"->>'message', '시스템 점검 중입니다.'),
          'scheduledStartAt', scheduled."value"->'scheduledStartAt',
          'scheduledEndAt', scheduled."value"->'scheduledEndAt'
        ),
        "description" = '시스템 점검 활성화, 안내 문구 및 예약 스케줄 설정'
      from "system_config" as emergency
      where scheduled."key" = 'maintenance.scheduled'
        and emergency."key" = 'maintenance.emergency'
        and not exists (
          select 1 from "system_config" where "key" = 'maintenance'
        );
    `);

    this.addSql(`
      update "system_config"
      set
        "key" = 'maintenance',
        "value" = jsonb_build_object(
          'enabled', coalesce(("value"->>'enabled')::boolean, false),
          'message', coalesce("value"->>'message', '시스템 점검 중입니다.'),
          'scheduledStartAt', null,
          'scheduledEndAt', null
        ),
        "description" = '시스템 점검 활성화, 안내 문구 및 예약 스케줄 설정'
      where "key" = 'maintenance.emergency'
        and not exists (
          select 1 from "system_config" where "key" = 'maintenance'
        );
    `);

    this.addSql(`
      update "system_config"
      set
        "key" = 'maintenance',
        "value" = jsonb_build_object(
          'enabled', coalesce(("value"->>'enabled')::boolean, false),
          'message', '시스템 점검 중입니다.',
          'scheduledStartAt', "value"->'scheduledStartAt',
          'scheduledEndAt', "value"->'scheduledEndAt'
        ),
        "description" = '시스템 점검 활성화, 안내 문구 및 예약 스케줄 설정'
      where "key" = 'maintenance.scheduled'
        and not exists (
          select 1 from "system_config" where "key" = 'maintenance'
        );
    `);

    this.addSql(`delete from "system_config" where "key" in ('maintenance.emergency', 'maintenance.scheduled');`);
  }

  override down(): void | Promise<void> {
    this.addSql(`delete from "system_config" where "key" = 'maintenance';`);
  }
}
