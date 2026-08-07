import { Migration } from '@mikro-orm/migrations';

export class Migration20260808092000NormalizeRulePermissions extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`update \`rule\` set \`permissions\` = '{}' where json_type(\`permissions\`) = 'array';`);
  }

  override down(): void | Promise<void> {
    // The old array shape cannot be restored without discarding permission data.
  }
}
