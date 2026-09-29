import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Exceptions are app-owned values, policies, or bindings to those implementations.
// Every other file in these directories must exist on both sides with identical bytes.
const scopes = [
  { kind: 'api', directory: 'common', exceptions: {
  } },
  { kind: 'api', directory: 'infra', exceptions: {
    'database/migrations/': '앱별 DB 스키마 이력과 스냅샷',
    'database/seeders/': '앱별 권한·계정·약관·초기 데이터',
    'delivery/channels/webhook/webhook-delivery.service.ts': '서비스 시스템 설정에 연결된 웹훅 전송 정책',
  } },
  { kind: 'web', directory: 'components', exceptions: {
    'app/app-bootstrap.tsx': '관리자 인증 초기화',
    'app/app-guard.tsx': '관리자 접근·온보딩 정책',
    'app/brand-logo.tsx': '앱 이름과 접힌 로고 표시',
    'layout/app-layout.tsx': '관리자 메뉴·계정·경로 연결',
    'layout/index.ts': '관리자 레이아웃 / 공개 레이아웃 export',
    'layout/public-layout.tsx': '서비스 공개 메뉴·계정·경로 연결',
    'layout/screen-layout.tsx': '앱별 로고·언어 전환·화면 크기 정책',
  } },
  { kind: 'web', directory: 'hooks', exceptions: {
  } },
  { kind: 'api', directory: 'locales', exceptions: {} },
  { kind: 'api', directory: 'entities/logs', exceptions: {} },
  { kind: 'api', directory: 'types', exceptions: {} },
  { kind: 'web', directory: 'core', exceptions: {
    'locales/en/index.ts': '서비스 화면 번역 리소스 등록',
    'locales/ko/index.ts': '서비스 화면 번역 리소스 등록',
    'locales/en/service.json': '서비스 전용 화면 문구',
    'locales/ko/service.json': '서비스 전용 화면 문구',
  } },
  { kind: 'web', directory: 'lib', exceptions: {
  } },
  { kind: 'web', directory: 'configs', exceptions: {
    'app.config.ts': '앱별 쿼리 경로·캐시·갱신 주기',
  } },
];

function files(directory, base = directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path, base) : [relative(base, path)];
  });
}

const rows = [];
const differences = [];
for (const { kind, directory, exceptions } of scopes) {
  const admin = join(root, `apps/admin-${kind}/src/${directory}`);
  const service = join(root, `apps/service-${kind}/src/${directory}`);
  const left = new Set(files(admin));
  const right = new Set(files(service));
  const row = { scope: `${kind}/${directory}`, identical: 0, excluded: 0, unexpected: 0 };
  for (const file of [...new Set([...left, ...right])].sort()) {
    if (directory === 'infra' && (
      (process.argv.includes('--exclude-migrations') && file.startsWith('database/migrations/'))
      || (process.argv.includes('--exclude-seeders') && file.startsWith('database/seeders/'))
    )) continue;
    if (left.has(file) && right.has(file) && readFileSync(join(admin, file)).equals(readFileSync(join(service, file)))) {
      row.identical += 1;
      continue;
    }
    const exception = Object.keys(exceptions).find((key) => key.endsWith('/') ? file.startsWith(key) : file === key);
    const status = !left.has(file) ? 'service only' : !right.has(file) ? 'admin only' : 'different contents';
    row[exception ? 'excluded' : 'unexpected'] += 1;
    differences.push({ scope: row.scope, file, status, reason: exception ? exceptions[exception] : null });
  }
  rows.push(row);
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ rows, differences }, null, 2));
} else {
  console.log('scope | identical pairs | app-specific differences | unexpected differences');
  for (const row of rows) console.log(`${row.scope} | ${row.identical} | ${row.excluded} | ${row.unexpected}`);
  const unexpected = rows.reduce((sum, row) => sum + row.unexpected, 0);
  console.log(`Result: ${unexpected === 0 ? 'PASS' : 'FAIL'} (${unexpected} unexpected differences)`);
  if (process.argv.includes('--details')) {
    for (const item of differences) console.log(`${item.scope}/${item.file} | ${item.status} | ${item.reason ?? 'UNEXPECTED'}`);
  }
}

if (rows.some((row) => row.unexpected > 0)) process.exitCode = 1;
