# Apps 통합 배포 전환 작업계획서

## 목표

GitHub Actions의 자동 배포는 apps의 네 개 실행 앱 이미지만 대상으로 한다. 기존 template 단일 이미지 배포 workflow는 제거했다. apps는 네 서비스를 하나의 Compose 릴리스로 관리하며, 한 커밋의 네 이미지를 함께 배포한다. Postgres, Redis, Loki, Vector 등 기존 인프라는 앱 릴리스와 분리한다.

workflow 제거만으로 서버의 기존 `service-factory-app` 컨테이너가 종료되지는 않는다. 운영 라우팅을 새 앱으로 전환한 뒤 기존 앱 컨테이너만 종료·제거해야 한다. 기존 template Compose 전체를 `down`하면 함께 관리하던 인프라와 Cloudflare Tunnel도 종료되므로 사용하지 않는다. template 소스와 수동 배포 파일은 저장소에 남아 있다.

성공 상태:

- `admin-api`, `admin-web`, `service-api`, `service-web` 각각의 이미지가 동일한 소스 커밋으로 빌드되고, 커밋 SHA로 식별된다.
- 한 커밋에서 빌드한 네 이미지가 같은 Compose 갱신에서 실행된다.
- 네 앱의 readiness가 모두 통과해야 배포 workflow가 성공한다.
- 배포 기록은 커밋 SHA로 식별하며, 실패 시 같은 네 이미지 조합으로 복구할 수 있다.
- 외부 URL, 데이터베이스, 업로드 파일, 운영 secret은 전환 중 기존 동작과 값을 유지한다.

## 현재 저장소에서 확인된 사실

2026-10-02 앱 네 개의 운영 배포를 완료했다. 실제 구성·검증·작은 서버의 배포 제한은 [apps-prd-readiness.md](./apps-prd-readiness.md)를 따른다. 아래 단계별 계획 중 기존 template 데이터 보존·이전은 사용자 요청에 따라 적용하지 않았다.

`apps/deployment/`는 네 앱의 이미지와 서비스를 정의한다. `Dockerfile.prd`는 Turbo로 대상 workspace를 prune하고, `docker-compose.prd.yml`은 네 서비스와 healthcheck를 정의한다. `.github/workflows/cd.yml`은 전체 검사와 네 이미지의 SHA tag 빌드·게시 뒤 같은 SHA의 Compose 릴리스를 서버에 적용한다. 운영값과 실제 이미지/서버 동작은 별도 준비 및 운영 검증이 필요하다.

| 영역 | 현재 상태 | 계획에 미치는 영향 |
|---|---|---|
| 실행 앱 | 앱 manifest와 `docker-compose.apps.dev.yml`에 `admin-api`, `admin-web`, `service-api`, `service-web`이 등록돼 있다. | 초기 운영 전환 대상은 이 네 앱이다. `apps/auth-service` 디렉터리는 있지만 manifest와 Compose 서비스가 없어 배포 대상에서 제외한다. |
| CI | `.github/workflows/ci.yml`은 PR(`main`, `dev`) 및 `dev` push에서 전체 workspace typecheck/lint를 실행한다. | 첫 전환에서는 기존 전체 검사를 유지한다. 영향 앱 단위 검사로 줄이는 작업은 별도 최적화로 둔다. |
| CD | template 단일 이미지 배포 workflow는 제거했다. `.github/workflows/cd.yml`만 네 앱 이미지를 같은 SHA로 빌드·게시하고 Compose 전체를 갱신한다. | apps는 네 서비스 전체가 건강해야 성공으로 처리한다. 기존 서버 컨테이너 종료는 별도 운영 전환 작업이다. |
| 수동 배포 | template은 기존 로컬 빌드 및 SSH 배포 스크립트를 유지한다. apps의 package scripts는 선택 서비스의 비상 수동 갱신 경로를 제공한다. | 정상 apps 배포는 GitHub Actions가 담당한다. 수동 경로는 비상 복구 용도로 구분한다. |
| 운영 Compose | 템플릿의 `template/deployment/docker-compose.prd.yml`은 infra 파일 네 개를 include하고 단일 앱, `cloudflared`를 정의한다. 앱용 `apps/deployment/docker-compose.prd.yml`은 네 서비스와 healthcheck를 정의하고 기존 runtime network 및 각 API upload volume을 외부 리소스로 요구한다. | API/Web별 네트워크 주소 및 기존 별칭 소비처를 확인한 후 라우팅을 옮긴다. 앱 Compose에는 아직 host route/tunnel 설정이 없으며 앱 하나의 재생성 범위를 보존해야 한다. |
| 개발 Compose | `apps/deployment/docker-compose.dev.yml`은 네 앱을 각각 Node 프로세스로 실행한다. 포트는 admin-api 14000, admin-web 13000, service-api 4000, service-web 3000이다. Compose와 Dockerfile, 개발 env 파일은 `apps/deployment`가 소유한다. | 이 포트는 개발 설정이다. 운영 포트, 주소, 외부 호스트명으로 간주하지 않는다. 앱 시작 명령은 각 package의 `start`를 기준으로 확인한다. |
| 빌드 | `template/deployment/Dockerfile.prd`는 `template`과 모든 package를 복사하고 전체 `pnpm build`를 실행한 뒤 workspace 전체를 실행 이미지에 복사한다. 앱용 `apps/deployment/Dockerfile.prd`는 대상 앱 workspace를 prune하고 production 배포물 및 BuildKit secret으로 전달된 encrypted env 파일을 이미지에 복사하도록 구성됐다. 네 앱의 x86 Docker 이미지 빌드와 로컬 production 빌드를 검증했다. Web 이미지도 컨테이너 기동과 readiness/페이지 응답을 확인했다. | 앱 빌드 산출물과 production dependency만 포함되는지 CI에서 검증하고, 빌드 시 비밀값 요구가 없도록 유지한다. `VITE_*` 브라우저 공개값은 secret과 구분해 빌드 인자로 관리한다. |
| 데이터/환경 | 템플릿 운영 설정 `template/deployment/env/.env.prd`는 기존 단일 앱 변수 집합을 포함한다. 앱 배포는 서비스별 encrypted `.env.prd`를 GitHub Actions의 BuildKit secret file로 전달해 각 앱 이미지에 포함하고, 컨테이너 시작 시 runtime secret으로 전달한 키로 복호화한다. 앱별 암호화 운영 파일과 GitHub 복호화 키는 준비했다. 2026-10-02 운영에 새 DB 두 개와 관리자/서비스 서브도메인 라우팅을 적용했다. 사용자 요청으로 기존 template DB와 uploads volume은 이전하지 않고 삭제했다. 앱 API별 uploads volume을 새로 생성했다. | 앱 실행 서버에는 서비스별 env 파일을 따로 둘 필요가 없다. 이미지에 복호화 키를 넣지 않는다. 기존 업로드 파일은 DB의 파일 URL/소유 API를 대조해 분류하고, 운영 DB/URL/터널/변수 소비처를 확인한 뒤 이전한다. |

## 목표 설계와 배포 규칙

### 이미지

- 이미지명: `ghcr.io/<owner>/<repo>/<app>:<full-commit-sha>` (예: `ghcr.io/<owner>/<repo>/admin-api:<full-sha>`). 배포 식별자로 `latest`를 쓰지 않는다.
- 각 이미지에 OCI label `org.opencontainers.image.revision`과 앱 식별자를 기록한다. 필요하면 편의용 `latest`를 추가로 붙일 수 있지만 운영 Compose는 SHA를 사용한다.
- `apps/deployment/Dockerfile.prd`에서 앱 인자로 workspace를 prune한다. 각 이미지에는 해당 앱의 `dist`와 production dependency만 둔다.
- build context에는 lockfile, workspace 정의, 타깃 앱, 해당 앱의 내부 workspace dependency만 포함한다. 구현 전에 `pnpm deploy`/Turbo prune 중 현재 pnpm 설정에서 재현 가능한 방법을 확인한다.
- API와 Web Node 서버 모두 현재 package `start`를 기준으로 실행하고 `PORT`를 명시한다. 네 앱 모두 live/ready route가 코드에 있다. API `/health/ready`는 DB와 Redis를 확인하고 Web `/health/ready`는 대응 API의 `/health/live` 응답을 확인한다. 실제 글로벌 API prefix를 반영해 Compose healthcheck 및 배포 후 검사 경로를 연결한다.
- 비밀값을 이미지 build arg, layer, 로그에 기록하지 않는다. 브라우저 번들에 포함되는 `VITE_*`는 공개 가능한 값만 허용한다.

### 서비스 및 상태

초기 운영 서비스 ID는 workspace 이름 그대로 사용한다: `admin-api`, `admin-web`, `service-api`, `service-web`. 이미지/포트/환경변수/healthcheck/restart/network 별칭은 서비스별로 명시한다. 고정 `container_name`은 제거해 Compose가 관리하게 한다. 기존 서비스 이름 `app`과 별칭 `frontend`/`backend`를 제거하기 전에 소비처를 찾아 새 DNS 이름으로 바꾼다.

Compose는 네 앱을 하나의 프로젝트로 관리한다. CI는 이미지 ref를 같은 커밋 SHA로 고정하고 서버에서 네 이미지를 함께 pull/up한다. 암호화 env 파일은 이미지 빌드 때 포함하고, 배포 시 외부 network, upload volume, runtime 복호화 키를 확인한다. healthcheck가 모두 통과해야 성공 처리한다. 인프라는 Compose 파일에 포함하지 않으며 운영 서버에 이미 존재해야 한다.

### 변경 범위 및 자동 배포

- `apps/**`, `packages/**`, workspace 설정, lockfile 또는 CD workflow가 바뀌면 네 이미지를 모두 빌드한다. 변경 영향 계산은 도입하지 않는다.
- 네 이미지는 같은 commit SHA로 태그한다. matrix 빌드가 모두 성공한 뒤에만 서버 배포 job이 실행된다.
- 서버는 workflow가 빌드한 SHA의 Compose 설정을 사용해 외부 network/volume을 확인한 다음 네 앱을 함께 갱신한다. encrypted `.env.prd` 파일은 workflow가 이미지 빌드에 포함하므로 앱 실행 서버에 둘 필요가 없다.
- 네 서비스 healthcheck가 전부 통과해야 workflow가 성공한다. PR 검사는 typecheck/lint를 유지하고 운영 서버에는 접속하지 않는다.
- `workflow_dispatch`는 실행 대상 ref의 SHA를 빌드하고 배포한다. 같은 서버의 배포는 concurrency로 직렬화한다.
- 선택 서비스의 emergency helper는 남기되 정상 배포 경로로 사용하지 않는다.

## 단계별 실행 계획

각 단계는 앞 단계의 산출물과 Exit 조건을 확인한 뒤 진행한다. 운영 URL, secret, 데이터 경로 확인 전에는 운영 Compose 전환을 시작하지 않는다.

### 0단계 — 운영 계약과 영향 범위 조사

**수정 범위:** 문서만 변경. 운영 구성 값은 읽기 전용으로 확인한다.

1. 네 앱의 package `start`, bind address, `PORT` 처리, 기존 live/ready route 및 글로벌 API prefix, DB/Redis 사용, 파일 읽기/쓰기 경로를 코드에서 목록화한다. 현재 API readiness는 DB/Redis ping을 포함하고 Web readiness는 대응 API liveness만 확인한다는 차이를 매트릭스에 기록한다.
2. `admin-web`/`service-web`의 서버 측 `API_BASE_URL`, `API_SPEC_URL` 등 API 주소와 API 간 `ADMIN_API_URL`/`SERVICE_API_URL` 사용처를 확인한다. 각 API의 `APP_BASE_URL`은 외부 공개 웹 주소이며, 운영 Compose는 `ADMIN_WEB_URL`/`SERVICE_WEB_URL` 입력값을 각 API의 `APP_BASE_URL`로 전달한다. Vite build 환경값과 Node runtime 환경값을 분리한다.
3. 운영 `.env.prd` 변수명만 앱별 소비처에 매핑한다. GitHub secret, 서버 배포 경로, GHCR 권한, SSH 계정/포트는 실제 설정에서 담당자가 확인한다. 비밀값 자체를 산출물에 기록하지 않는다.
4. 운영 도메인/경로와 Cloudflare tunnel ingress 설정 위치 및 현재 대상 포트를 확인한다. 개발 포트를 운영값으로 가정하지 않는다.
5. 운영 Postgres 인스턴스/DB명/사용자/백업 정책, Redis 공유 여부, 각 API migration 명령과 실행 권한을 확인한다.
6. 업로드 볼륨에 든 데이터 용량/권한/DB에서 참조하는 파일 URL 및 실제 소유 API를 조사한다. 두 API가 모두 `data/uploads`를 사용하므로 파일을 서비스별로 분류해 새 경로로 복사하는 방법과 원복 방법을 정한다.
7. 이전 이미지로 되돌릴 수 있는 기간, 스테이징 서버/도메인의 유무를 확인한다.

**산출물:** 비밀값 없는 `docs/apps-deployment-matrix.md` (서비스 ID, 운영 포트/주소, start/health, env 변수명, dependencies, DB ownership, 파일 경로/volume, 외부 route, migration 명령, 담당 확인 여부).

**Exit 조건:** 네 앱 모두 start/env/health 계약이 기록되고, 운영 외부 URL·DB·파일 경로·터널 라우팅·스테이징/복구 가능성이 확인된다. 미확인 항목이 있으면 해당 위험과 결정 책임자를 기록하고 구현 착수 범위를 제한한다.

### 1단계 — 앱별 재현 가능한 production image

**변경 파일:** `apps/deployment/Dockerfile.prd` (초기 구현 추가됨). 필요 시 build helper 또는 root package scripts.

1. Turbo/pnpm workspace dependency를 분석해 앱 하나와 필요한 workspace 패키지만 빌드하는 경로를 구현한다.
2. Build stage와 runtime stage를 분리한다. 앱별로 Node production runtime, 비root 사용자, `tini`, signal handling, workdir, 명시적 `PORT`, healthcheck를 구성한다.
3. 런타임에 필요한 자산, migrations, Prisma/MikroORM config 등 앱별 파일이 산출물에 포함되는지 검증한다. 개발 도구/다른 앱 source는 runtime image에 넣지 않는다.
4. 앱별 encrypted `.env.prd`를 BuildKit secret file로 전달해 암호문만 이미지에 복사하고 복호화 키는 runtime secret으로 유지한다. 브라우저 공개 build 변수는 공개 여부를 확인하고 각 Web 이미지에만 필요한 변수로 분리한다.
5. CI에서 네 이미지의 build만 수행하고 실행 또는 container health 확인을 한다. 아직 GHCR 게시와 운영 서버 변경은 하지 않는다.

**Exit 조건:** 네 이미지가 로컬/CI에서 각기 build 및 실행되고, 이미지 내 앱/커밋 label과 runtime env 분리가 확인된다. 앱 A 빌드가 앱 B의 runtime source를 포함하지 않는지 확인한다.

### 2단계 — 앱 Compose, secret, route 및 데이터 경계

**변경 파일:** `apps/deployment/docker-compose.prd.yml`, Compose env 및 runtime env 예제, `apps/deployment/README.md` (초기 기반 추가됨). route/volume/network 운영값은 확인·등록했고 실제 운영 배포를 완료했다. 필요 시 `apps/deployment/infra/vector/manifest.yml` 및 tunnel 운영 설정 안내.

1. 단일 `app`를 네 앱 서비스로 바꾸고 각 서비스가 SHA 이미지 변수, 내부 port, runtime 환경변수, restart 정책, healthcheck를 사용하도록 한다.
2. `depends_on`을 실제 startup 순서에만 활용한다. 배포 성공은 앱 healthcheck/API readiness 응답으로 판단한다.
3. 앱 DNS 주소와 외부 Cloudflare ingress를 설정한다. 기존 `frontend`/`backend` alias 소비자를 새 앱 주소로 옮긴다. API/Web의 기존 live/ready route와 Web readiness의 API 의존성에 맞춰 healthcheck를 구성한다. 외부 라우팅 전환/복구 방법을 함께 문서화한다.
4. infra Compose include와 데이터 볼륨 이름은 유지한다. 앱 배포에서 `down`, `down -v`, `--remove-orphans`를 사용하지 않는다.
5. 서비스별 운영 env 파일을 dotenvx encrypted `.env.prd`로 관리한다. GitHub Actions가 각 파일을 BuildKit secret file로 Dockerfile에 전달하고, Dockerfile은 암호문을 해당 앱 이미지에 복사한다. 컨테이너 시작 시 runtime secret으로 전달된 키로 복호화한다. 복호화 키나 평문 운영값은 이미지에 넣지 않는다. 현재 encrypted env의 키/값은 새 계획 문서에 복사하지 않는다.
6. 업로드 volume은 백업한다. DB에서 참조하는 URL/prefix를 기준으로 파일을 API별로 분류해 각 컨테이너의 `data/uploads` volume 경로로 복사하고 파일 개수/크기/권한/API 다운로드를 검증한다. 양 API에 같은 구 volume을 그대로 연결해 파일이 섞이지 않도록 한다. 복구를 위해 원본 volume은 전환 승인 전 삭제하지 않는다.
7. `cloudflared`가 더 이상 `app` 서비스에 의존하지 않도록 구성하되, 터널 자체는 앱 update에서 recreate되지 않게 한다.

**Exit 조건:** staging에서 네 앱 주소, 앱 간 호출, 외부 TLS route, readiness, 로그 분류, 파일 업로드/다운로드, 재기동 후 데이터 보존이 확인된다. `docker compose config` 결과에서 각 앱 image/환경변수/network가 올바르게 해석된다.

### 3단계 — CI/CD 통합 릴리스

**변경 파일:** `.github/workflows/cd.yml`, `apps/deployment/README.md`.

1. PR 검사와 전체 typecheck/lint를 유지한다.
2. `main` push 및 수동 실행에서 네 앱 이미지를 같은 commit SHA로 빌드해 GHCR에 게시한다.
3. 네 이미지 게시가 모두 성공한 뒤 서버에 SSH로 접속해 해당 SHA의 Compose 설정과 runtime secrets를 준비한다. 암호화 env 파일은 이미지에 포함된다.
4. Compose 변수, 외부 network, 기존 upload volume을 사전 확인한 뒤 네 이미지를 함께 pull하고 네 서비스를 하나의 Compose 갱신으로 실행한다.
5. Compose healthcheck가 네 서비스 모두 통과할 때만 workflow를 성공 처리하고, commit과 이미지 ref를 workflow summary에 기록한다.
6. 비상 수동 helper는 유지하되 정상 배포 경로는 GitHub Actions로 둔다.

**Exit 조건:** staging에서 같은 SHA의 네 이미지가 함께 배포되고, readiness 실패 및 외부 리소스 누락이 성공으로 처리되지 않는다. 직전 SHA 네 이미지 조합으로 전체 릴리스를 복구할 수 있다.

### 4단계 — DB migration과 운영 runbook

1. `admin-api`와 `service-api`의 migration 명령, DB 권한, 백업/복구 절차를 분리 기록한다. 현재 package scripts는 각각 `db:migrate: mikro-orm migration:up`을 선언하므로 각 앱에서 올바른 config/DB로 실행되는지 검증한다.
2. 배포 시 migration이 필요한 경우 명시적 one-shot job/SSH 단계에서 선택 API에 대해서만 실행한다. 매 앱 시작 시 모든 migration을 암묵 실행하지 않는다.
3. expand/contract 방식을 적용한다. API 변경 전후 구버전/신버전이 공존해도 동작해야 한다. 호환 불가 migration은 API 배포와 함께 강제 순서 및 서비스 영향 시간을 명시한다.
4. runbook에 preflight, 현재 SHA 확인, 이미지 pull, migration/backup gate, 네 서비스 갱신, readiness 검증, 전체 릴리스 rollback, 로그 확인, 운영 Compose 복구 절차를 기록한다.
5. GHCR에 직전 배포 SHA 이미지를 유지하고, 서버 이미지 정리 정책이 현재/직전 release tag를 지우지 않는지 검증한다.

**Exit 조건:** staging에서 API migration forward/실패/앱 롤백 시나리오를 수행하고 데이터 복구 책임 및 순서를 운영자가 runbook만 보고 재현할 수 있다.

### 5단계 — 점진 운영 전환과 구 경로 제거

1. staging에서 API와 Web을 모두 새 Compose로 실행하고, 기존 서비스 URL과 기능 smoke check를 통과시킨다.
2. 운영 전환 전 DB 백업, 현재 이미지 SHA/Compose/env snapshot, 업로드 volume snapshot, 터널 설정 백업을 확인한다.
3. 유지보수/전환 창에 새 서비스를 준비한다. 먼저 Web route를 새 Web 서비스로 옮기고, 이어 API route 및 API 간 내부 주소를 갱신한다. 각 앱을 health 확인하고 다음으로 진행한다.
4. 전환 확인 중 오류가 나면 route를 기존 경로로 돌리고, 기존 컨테이너/이미지와 volume을 유지해 이전 배포로 복구한다. DB schema를 역변경하지 않고 이전 API image가 호환되는지 확인한다.
5. 정한 관찰 기간 동안 오류율, 앱 health, API 기능, 파일 접근, 로그, 리소스를 확인한다. 관찰 기간은 운영자가 단계 0에서 정한다.
6. 전환 안정화와 전체 릴리스 복구 훈련 후 구 단일 앱 경로와 불필요한 예전 볼륨 참조를 제거한다. infra와 보존해야 할 upload volume은 별도 확인 후에만 정리한다.

**Exit 조건:** 운영 네 앱이 같은 SHA의 Compose 릴리스로 실행되고, 전체 릴리스의 배포·복구 기록이 남으며, 구 단일 앱 배포 경로의 종료 시점이 정해져 있다.

## 완료 기준

- 이미지/런타임: 네 앱 모두 같은 commit의 독립 이미지이며 앱 ID와 full SHA를 이미지 및 배포 기록에서 확인할 수 있다.
- 릴리스: 네 앱 이미지가 같은 commit SHA를 사용하고 하나의 Compose workflow로 함께 갱신된다.
- 인프라 경계: apps 배포는 외부 Postgres, Redis, Loki, Vector 및 업로드 volume을 생성·삭제하지 않는다.
- 배포 안전성: 이미지 pull/preflight/migration/readiness 실패는 성공 처리되지 않으며, 이전 SHA 네 이미지 조합으로 복구할 수 있다.
- 보존: 기존 DB와 upload data가 유지되고, 배포 과정에 volume 삭제 명령이 없다.
- 보안: private key/secret은 image와 log에 나타나지 않고, runtime에 앱별로 필요한 값만 제공된다.
- 라우팅: 운영 URL, 인증/cookie origin, API 내부 주소, Cloudflare route가 앱별로 확인된다.

## 주요 결정 항목 및 리스크

| 항목 | 확인/결정 필요 사항 | 완료 전 제한 |
|---|---|---|
| 운영 route | Cloudflare Tunnel ingress가 Dashboard 또는 저장소 어디서 관리되는지, 실제 host/path/port, 전환 방법 | 새 Compose를 운영 트래픽에 연결하지 않음 |
| 환경변수 | 기존 dotenvx 변수 중 앱별 runtime secret, 서버 공개 설정, 브라우저 공개 build 설정 구분 | private 값으로 앱 image를 build하지 않음 |
| DB | 운영 API별 DB 위치/backup, migration 실행 권한/순서 | API 운영 전환 금지 |
| 업로드 | 실제 데이터/API owner, 복사 크기/시간, 소유권 및 롤백 volume | 원본 volume 삭제/이름 변경 금지 |
| 네트워크 | `frontend`/`backend` alias 및 host port 사용처 | 기존 alias 제거 금지 |
| capacity | 동일 서버에서 old/new 이미지 및 컨테이너를 전환 중 함께 수용할 수 있는지 | 무중단/rollback 가능성을 전제하지 않음 |
| 스테이징 | 별도 서버 또는 route 없이 검증할 수 있는 환경의 존재 | staging 확인 없이는 운영 전환 금지 |

## 권장 실행 순서

1. 단계 0 운영 계약 조사와 배포 매트릭스 작성.
2. 단계 1 네 앱 production 이미지 구현 및 CI build 검증.
3. 단계 2 운영 Compose/route/secret/data 경계 구현 및 staging 검증.
4. 단계 3 SHA 기반 전체 릴리스 CI/CD 적용 및 검증.
5. 단계 4 DB/rollback runbook 작성 및 staging 실패 훈련.
6. 단계 5 유지보수 창에 운영 전환, 관찰, 구 단일 앱 경로 제거.

구현 시에는 각 단계의 범위만 변경하고 그 단계의 Exit 조건을 확인한다. 운영 secret 값은 이 문서, image, workflow log, commit에 기록하지 않는다.

운영 배포 결과는 [apps-prd-readiness.md](./apps-prd-readiness.md)를 참고한다.
