import { Migration } from '@mikro-orm/migrations';

export class Migration20260924020000AddSupportPermissions extends Migration {
  override up(): void {
    this.addSql(`insert into "permission" ("id", "createdAt", "updatedAt", "code", "label", "description") values (md5('support:read')::uuid, now(), now(), 'support:read', '고객지원 조회', '고객지원 상담방 조회') on conflict ("code") do update set "label" = excluded."label", "description" = excluded."description", "deletedAt" = null, "deletedBy" = null;`);
    this.addSql(`insert into "permission" ("id", "createdAt", "updatedAt", "code", "label", "description") values (md5('support:update')::uuid, now(), now(), 'support:update', '고객지원 답변', '고객지원 상담방 답변 및 상태 변경') on conflict ("code") do update set "label" = excluded."label", "description" = excluded."description", "deletedAt" = null, "deletedBy" = null;`);
    this.addSql(`update "role" set "permissions" = array_append("permissions", 'support:read') where "code" in ('admin', 'super_admin') and not ('support:read' = any("permissions"));`);
    this.addSql(`update "role" set "permissions" = array_append("permissions", 'support:update') where "code" in ('admin', 'super_admin') and not ('support:update' = any("permissions"));`);
  }

  override down(): void {
    this.addSql(`update "role" set "permissions" = array_remove("permissions", 'support:read') where "code" in ('admin', 'super_admin');`);
    this.addSql(`update "role" set "permissions" = array_remove("permissions", 'support:update') where "code" in ('admin', 'super_admin');`);
    this.addSql(`delete from "permission" where "code" in ('support:read', 'support:update');`);
  }
}
