# Apps PRD 배포 상태

확인일: 2026-10-02. 앱 이미지 네 개를 운영 서버에 배포하고 공개 도메인의 브라우저 로그인과 새로고침 후 세션 복원을 확인했다.

## 운영 구성

- 서비스: https://servicefactory.cloud → Tunnel → `service-web:3000` → `service-api:3000`.
- 관리자: https://admin.servicefactory.cloud → Tunnel → `admin-web:3000` → `admin-api:3000`.
- 배포된 앱 이미지 revision: `48737ca6791669daeb9222ebbcef4f3c9e521e14`.
- GitHub Actions: https://github.com/JYK0128/web-framework-app/actions/runs/36886427571. 품질 검사, 이미지 네 개의 build/push, SSH 배포가 성공했다. 현재 작업 브랜치에서 workflow_dispatch로 실행했다.
- 서버: `server01`, x86_64, RAM 약 951MiB, swap 약 2GiB.
- 앱과 인프라의 공유 network: `service-factory-prd_default`.
- 앱 DB: `admin_db`, `service_db`. 마이그레이션 실행 이력은 각각 하나, 기본 사용자도 각각 하나다. 테스트 계정 seeding 정책은 요청대로 유지했다.
- 업로드 볼륨: `service-factory-apps-prd_admin-api-uploads`, `service-factory-apps-prd_service-api-uploads`. API 실행 UID/GID 10001의 쓰기 권한을 확인했다.
- 기존 template 앱 컨테이너·이미지, `template_db`, 기존 template uploads volume은 삭제했다. PostgreSQL의 공용 volume에는 새 앱 DB가 있으므로 유지했다.
- PostgreSQL/Redis/Loki/Vector 설정은 checkout 밖의 `/home/ubuntu/service-factory-runtime/infra/`에 있다. 인프라 Compose와 기존 Tunnel의 재기동 구성은 같은 runtime 디렉터리에 보관한다.
- Vector는 `com.docker.compose.project=service-factory-apps-prd` 라벨로 앱 로그를 선택한다.

## 초기 마이그레이션

- 누적 마이그레이션 45개를 제거하고 각 API를 `Migration20261002000000_initial` 하나로 다시 시작했다.
- 현재 엔티티에서 생성한 스키마이며 관리자 13개, 서비스 18개 테이블이다.
- 격리된 PostgreSQL에서 up → down → up, seed 두 번, up 반복을 검증했다. 엔티티와 DB 스키마 차이는 없었고 실행 이력은 각 하나였다.
- 기존 데이터를 변환하는 업그레이드 경로가 아니다. 이전 앱 이력이 적용된 로컬 DB에는 새 초기 migration을 그대로 실행할 수 없다. 빈 DB로 초기화해야 한다.
- migration 또는 seed 실패 시 연결을 닫고 API 시작을 실패 처리한다.

## 검증

- 전체 workspace typecheck/lint, CD YAML(actionlint), Compose 설정, Vector 설정 검증을 통과했다.
- 네 앱의 linux/amd64 Docker 이미지 build/push를 완료했다. 운영 컨테이너 네 개가 healthy이고 최종 확인 시 재시작 횟수는 모두 0이었다.
- 공개 HTTPS 두 도메인에서 readiness 200, 실제 브라우저 로그인 200, 새로고침의 refresh 200과 세션 유지를 확인했다. 신규 운영자의 약관 동의는 사용자에게 남겨뒀다.
- 격리된 운영 모드 테스트에서 고객 Q&A → 관리자 답변 → 고객 화면 반영, 상담방 답변 반영의 Playwright 테스트 두 개가 통과했다.
- 격리된 업로드 테스트에서 비인증 요청 401, 관리자 인증 → service-api machine 인증 → 파일 저장과 원본 바이트 일치를 확인했다.
- Docker API 사용자로 운영 uploads volume 쓰기 권한을 확인했다. 운영 DB에 Q&A·상담 테스트 데이터를 추가하거나 운영 약관 동의를 대신 제출하지 않았다.

## 작은 서버의 배포 동작

- 첫 이미지 추출 때 CPU steal 약 75%가 관찰됐다. 이미지 추출과 기존 앱 실행이 겹친 재배포에서는 커널 global OOM으로 Node 프로세스가 종료됐다.
- 앱을 중지해 이미지 추출을 마친 뒤 기동한 결과 정상화됐다. 이후 CD는 registry/config/network/volume 확인 후 앱을 잠시 중지하고 이미지를 직렬로 pull한다. pull 실패 시 기존 컨테이너를 다시 시작하고 실패로 종료한다. 배포 중 잠시 서비스 중단이 있다.
- healthcheck에서 별도 Node를 띄우지 않고 Alpine wget을 사용한다. 검사 간격은 30초, timeout은 10초다. 다음 배포부터 첫 기동 grace 600초와 Compose wait 900초를 적용한다. SSH 명령 timeout은 75분이다. 앱은 admin-api → service-api → admin-web → service-web 순서로 각각 healthy를 확인한 후 다음 앱을 기동한다.
- 정상화 시점의 앱 메모리 snapshot은 admin-api resident 48.2MiB/swap 102.8MiB, service-api 43.0/107.3MiB, admin-web 24.8/59.3MiB, service-web 26.2/57.8MiB였다. 네 앱 합계는 약 469MiB이며 부하 테스트 평균이 아니다.

## 운영 설정 보관

- 앱별 encrypted `.env.prd`는 Git에 포함하고 복호화 키는 GitHub Secrets에 보관한다. 배포 작업용 로컬 키 사본은 정리했다.
- 기존 root secret의 같은 32바이트를 새 env 계약의 base64url로 인코딩했다. 두 API는 동일한 root secret을 사용한다. 기존 데이터와 세션은 이전하지 않았다.
- 운영 URL, 앱별 내부 포트 3000, network, uploads volume, PortOne 공개 build 값은 GitHub Variables에 등록했다. PortOne의 실제 본인인증 업무 테스트를 수행한 것은 아니다.
- `.local`과 plaintext env/key 파일은 Docker build context 및 Git에서 제외한다.

## 로컬 Docker

- Docker Desktop 디스크 한도를 32GiB → 48GiB로 늘렸다. 기존 데이터 volume은 유지했다.
- 사용하지 않는 기존 template 이미지 7개를 삭제했고 기존 로컬 앱과 DB/Redis를 다시 기동했다.
