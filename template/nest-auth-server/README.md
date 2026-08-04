# Nest Auth Server Starter Kit

NestJS와 MikroORM을 이용한 Better Auth 호환 세션 기반 인증 서버 템플릿입니다. 기본 개발 데이터베이스는 SQLite이며, 프론트엔드 연동은 포함하지 않습니다.

Better Auth의 기본 core schema인 `user`, `session`, `account`, `verification` 테이블을 사용합니다. 이메일/비밀번호 계정은 `account.providerId = "credential"`과 `account.password`에 저장됩니다.

모든 인증 엔티티는 `BaseEntity`를 상속하며 `createdAt/createdBy`, `updatedAt/updatedBy`, `deletedAt/deletedBy` 감사 필드를 공통으로 가집니다. `deletedAt/deletedBy`는 삭제 메타데이터이며, MikroORM의 `softDelete` 필터가 기본 적용됩니다.

요청마다 `AsyncLocalStorage` 기반 `RequestContext`가 생성됩니다. `requestId`는 정상·오류 응답과 응답 헤더에 포함되고 HTTP 로그에도 기록됩니다. 정상 응답은 `{ data, requestId }` 형식으로 반환됩니다. 인증된 사용자는 actor로 등록되고, MikroORM audit subscriber가 생성·수정 시 `createdBy/updatedBy`를 자동 기록합니다. 세션 logout과 만료 처리는 `deletedAt/deletedBy`를 기록하는 soft delete로 처리합니다.

성공한 HTTP 요청은 전역 `UnitOfWorkInterceptor`가 응답 직전에 MikroORM `flush()`를 자동 실행하며, 예외가 발생한 요청은 flush하지 않습니다.

이 템플릿은 NestJS REST API를 제공하며 Better Auth의 HTTP handler 자체를 직접 설치한 구조는 아닙니다. 나중에 Better Auth를 연결할 때는 동일한 스키마를 사용하고, 현재 `scrypt` 해시 함수와 동일한 커스텀 password adapter를 설정하면 됩니다.

## Environment

모든 환경변수는 필수입니다. `.env.example`을 환경별 파일로 복사한 뒤 값을 설정합니다. `NODE_ENV`가 앱 실행 모드와 `dotenvx`의 환경 파일 선택을 함께 담당합니다.

```bash
cp .env.example .env.development
cp .env.example .env.production
# 각 환경 파일의 값과 비밀값을 수정합니다.
```

## Seed

개발용 credential 사용자를 생성하려면 seed 환경변수를 지정합니다. 비밀번호는 저장 시 동일한 scrypt 포맷으로 해시됩니다.

```bash
pnpm db:seed
```

`db:seed`는 같은 이메일의 User와 credential Account를 다시 사용하므로 여러 번 실행해도 중복되지 않습니다.

## Entity 등록

MikroORM Entity 목록은 `discovery:export`로 [entities.generated.ts](./src/entities.generated.ts)를 생성합니다. Entity를 추가하거나 삭제한 뒤 다음 명령을 실행합니다.

```bash
pnpm db:entities:generate
```

생성 파일은 직접 수정하지 않습니다.

## Database

Entity 변경 후에는 migration을 생성하고 적용합니다. 데이터베이스 CLI 작업은 `src`의 TypeScript 파일을 직접 사용합니다. 기본 mode는 development이며, `NODE_ENV=production`을 지정하면 production 환경 파일을 사용합니다.

```bash
pnpm db:migrate:create -- -n add_example_column
pnpm db:migrate

# production DB 작업
NODE_ENV=production pnpm db:migrate
```

## 실행

실행 전에 허용할 프론트엔드 origin을 환경변수로 지정합니다.

```bash
pnpm --filter nest-auth-server-starter-kit dev
```

번들링과 minify는 esbuild가 담당하고, TypeScript 및 Nest decorator 변환은 `esbuild-plugin-swc`가 담당합니다. `tsc`는 타입 검사에만 사용합니다.

기본 주소는 `http://localhost:4000/api/v1`입니다. 개발 환경에서는 시작할 때 SQLite 스키마가 안전하게 생성됩니다.

Swagger UI는 development/test 환경에서 `http://localhost:4000/api/v1/docs`, OpenAPI JSON은 `http://localhost:4000/api/v1/docs-json`에서 확인할 수 있습니다. production 환경에서는 Swagger 라우트를 등록하지 않습니다. 요청 schema는 Zod 정의에서 생성됩니다.

인증 Guard는 전역으로 적용되며, `health`, `register`, `login`, `logout` 엔드포인트는 `@Public()`으로 공개됩니다. `auth/me`는 인증이 필요합니다.

## API

| Method | Path | 설명 |
| --- | --- | --- |
| `GET` | `/health` | 서버 상태 |
| `POST` | `/auth/register` | 회원가입 및 세션 발급 |
| `POST` | `/auth/login` | 로그인 및 세션 발급 |
| `GET` | `/auth/me` | 현재 사용자 조회 |
| `POST` | `/auth/logout` | 세션 폐기 |

회원가입과 로그인 요청 예시:

```json
{
  "email": "user@example.com",
  "password": "change-this-password",
  "name": "Example User"
}
```

Better Auth 호환을 위해 세션 토큰은 `session.token`에 저장하고, 같은 토큰을 `HttpOnly` 쿠키로 내려보냅니다. 비밀번호는 `account.password`에 Node.js `scrypt` 해시로 저장합니다.

## 운영 전환

- `DATABASE_PATH`를 PostgreSQL 드라이버 설정으로 교체합니다.
- `NODE_ENV=production`에서는 자동 스키마 변경이 실행되지 않으므로 MikroORM migration을 사용합니다.
- `COOKIE_SECURE=true`를 설정하고, 배포 도메인에 맞는 `CORS_ORIGINS`를 지정합니다.
- 기본 전역 요청 제한은 60초당 120회입니다. 로그인 엔드포인트에는 운영 정책에 맞는 더 낮은 제한을 추가하는 것을 권장합니다.
