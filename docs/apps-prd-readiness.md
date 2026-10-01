# Apps PRD 배포 준비 상태

확인일: 2026-10-02. 배포 대상은 admin-api, admin-web, service-api, service-web의 독립 이미지 네 개다. 서버에는 아직 기존 template 앱이 운영 중이며 새 앱을 배포하지 않았다.

## 초기 마이그레이션 재정리

- 사용자 요청으로 누적 마이그레이션 45개를 제거하고 각 API를 `Migration20261002000000_initial` 하나로 다시 시작한다.
- 현재 엔티티에서 생성한 스키마를 사용하며 관리자 13개, 서비스 18개 테이블이다.
- 격리된 PostgreSQL에서 up → down → up, seed 두 번, up 반복을 검증했다. 엔티티와 DB 스키마 차이는 없고 실행 이력은 각 하나다.
- 기존 데이터의 업그레이드·변환을 수행하는 마이그레이션이 아니다. 이전 이력이 적용된 앱 DB에 실행하지 않고 빈 DB에서 시작해야 한다.
- 운영은 기존 template 데이터 이전 없이 새 앱 DB로 시작한다.

## 완료한 준비

- 기존 template CD를 제거하고 앱 CD를 `.github/workflows/cd.yml`로 통합했다.
- 앱별 `apps/deployment/env/<app>/.env.prd` 네 개를 암호화했다. 복호화 키는 앱별 GitHub Secrets에 등록했고 로컬 원본 키는 Git에서 제외된 `.local/prd-keys/`에 보관한다.
- 기존 운영 root secret은 64자리 hex였다. 같은 32바이트를 새 env 계약에 맞는 base64url로 인코딩했다. 두 API는 동일한 root secret을 사용한다. 기존 암호화 데이터와 세션의 호환성이 검증된 것은 아니다.
- DB 연결은 별도 `admin_db`와 `service_db`를 대상으로 준비했다. 실제 서버에 두 DB를 생성하거나 기존 데이터를 이전하지 않았다. 기존 `template_db`의 dump는 접근이 제한된 `.local/prd-backup/`에 확보했다.
- GitHub에 운영 네트워크, 앱별 내부 포트(각각 3000), 기존 서비스 URL, PortOne 브라우저 공개값을 등록했다. SSH 관련 기존 secret은 유지했다.
- migration 또는 seed가 실패하면 ORM/Redis 연결을 닫고 API 시작을 실패 처리한다. 기존 테스트 계정 seeding 정책은 요청대로 유지했다.
- 실행 사용자 UID/GID를 10001로 고정하고 업로드 디렉터리를 준비했다. CD에서 이미지 pull 후 API 사용자로 볼륨 쓰기 권한을 검사한다.
- CD가 빌드 전에 필요한 운영 설정의 누락을 검사한다. 기존 인프라의 `docker/` bind mount가 남아 있으면 git reset 전에 배포를 중단한다.
- Turbo prune에서 사라지는 envMode 설정을 Docker build 명령에서 명시했다. 공개 build 변수도 캐시 입력에 포함했다. prune 전 전체 workspace 설치를 제거했다.
- `.local`을 Docker build context에서 제외했다.
- Vector는 `com.docker.compose.project=service-factory-apps-prd` 라벨로 새 앱 로그를 선택한다. 실제 서버 Vector 구성은 아직 교체하지 않았다.
- service-web에서 refresh 요청을 중복 실행하지 않고 이전 페이지 인증 검사 결과를 무시하도록 수정했다. 운영 모드에서 로그인 후 새로고침 시 세션이 해제되던 문제를 해결했다.

## 확인한 운영 서버

- SSH 대상: server01. x86_64 Linux, RAM 약 951MiB, swap 약 2GiB.
- 저장소 경로: `/home/ubuntu/web-framework-app`. 현재 서버 branch는 `deploy/docker`다.
- 기존 Docker network: `service-factory-prd_default`.
- 기존 DB: `template_db`. 사용자 1개, account 1개, resource 7개가 확인됐다. 내용을 출력하거나 변경하지 않았다.
- 기존 uploads volume: `service-factory-prd_service-factory-uploads`. 마운트된 경로에서 일반 파일은 0개였다. 다른 저장 위치까지 없는 것으로 단정하지 않는다.
- 기존 인프라는 `/home/ubuntu/web-framework-app/docker/infra/`의 파일을 bind mount한다. 새 코드로 checkout을 바꾸기 전에 안정된 경로로 이전해야 한다.
- Cloudflare의 현재 ingress는 `servicefactory.cloud` → `http://frontend:3000`이다. 기존 connector는 위 Docker network에 연결돼 있다.
- 기존 앱의 측정 시점 resident memory는 약 146MiB, swap은 약 434MiB였다. `docker stats` 값만으로 전체 메모리 비용을 판단하지 않는다. 신규 앱 네 개의 native 운영 서버 사용량은 미측정이다.

## 검증 결과와 제한

- 전체 workspace typecheck/lint, CD YAML(actionlint), Vector 설정 검증을 수행했다.
- admin-api와 service-api의 linux/amd64 Docker 이미지 빌드에 성공했다. 새 테스트 DB의 migration과 seed가 완료됐고 두 API readiness가 200을 반환했다.
- Web 두 개의 로컬 production 빌드와 linux/amd64 Docker 이미지 빌드에 성공했다. 각 이미지로 컨테이너를 기동해 `/health/ready`와 `/`의 200 응답을 확인했다. 브라우저 업무 테스트는 아래처럼 호스트 Web 서버에서 수행했다.
- 로컬 Docker Desktop 디스크 한도를 32GiB에서 48GiB로 늘려 disk-full을 해결했다. 기존 이미지와 데이터 volume은 보존했고, 재시작 후 기존 DB/Redis와 앱 네 개를 다시 기동했다. 기존 컨테이너의 옛 PostgreSQL/Redis bind mount 설정 파일은 로컬에 복구했다.
- 운영 모드 브라우저 테스트는 로컬 HTTPS의 서로 다른 관리자/서비스 호스트에서 실행했다. API는 격리된 Docker DB/Redis를 사용하고 Web은 호스트 Node에서 production 산출물을 실행했다.
- 신규 운영자 약관 동의를 UI에서 제출하고 API로 저장 상태를 확인했다.
- 고객 Q&A 등록 → 관리자 답변 → 양쪽 API와 고객 화면에서 결과 확인, 고객 상담 생성 → 관리자 답변 → 같은 상담방의 메시지 확인: 두 Playwright 테스트가 통과했다. 테스트는 운영 DB를 사용하지 않았다.
- 인증 없는 업로드 URL 발급은 401로 거절됐다. 관리자 인증 → service-api의 machine 인증 → 실제 파일 저장을 수행했고 파일 바이트가 원본과 일치했다.
- 로컬 테스트에서 disk-full migration 실패 시 API가 exit 1로 종료하는 것도 확인했다.
- 로컬 x86 emulation의 메모리와 지연을 운영 x86 서버의 native 실행 결과로 취급하지 않는다. 테스트 환경의 healthcheck timeout은 emulation을 위해 늘렸고, DB/업로드는 임시 메모리 저장소를 사용했다.

## 운영 전환에 필요한 정보와 작업

1. 관리자 public URL을 정하고 GitHub `ADMIN_WEB_URL`에 등록한다. 서비스 URL은 기존 `https://servicefactory.cloud`를 유지하도록 준비했다.
2. 기존 데이터를 새 앱에 이전할지, 신규 DB로 시작할지 결정한다. 두 앱의 초기 migration을 기존 `template_db`에 실행하면 안 된다. 데이터 이전은 컬럼/권한/암호화 계약을 별도로 대조해야 한다.
3. 위 결정에 맞춰 DB 두 개를 준비하고 API별 uploads volume을 생성·이전한다. GitHub `ADMIN_API_UPLOADS_VOLUME`/`SERVICE_API_UPLOADS_VOLUME`은 실제 확인된 이름을 등록한다. 비root UID 10001의 쓰기 권한을 확인한다.
4. 기존 인프라의 bind mount 경로를 checkout 외부로 이전한다. 원본 DB/Redis/Loki volume과 network는 보존한다. 이 작업 전에는 CD의 사전 검사가 배포를 차단한다.
5. Cloudflare 관리 권한으로 기존 서비스 ingress를 `http://service-web:3000`으로 변경하고 관리자 hostname을 `http://admin-web:3000`에 연결한다. connector token만으로 Dashboard 설정 변경 권한이 확보된 것은 아니다.
6. 서버 Vector를 새 라벨 선택 구성으로 전환한다. 기존 인프라 전체를 template Compose down으로 내리지 않는다.
7. 변경 파일을 커밋·push한다. 같은 SHA 이미지 네 개를 배포하고 readiness, HTTPS 로그인·새로고침, S2S, 파일 접근, resident/swap을 확인한다.
8. 새 라우팅과 기능이 확인된 뒤 기존 앱 컨테이너만 종료한다. 인프라와 기존 DB/uploads volume은 삭제하지 않는다.
