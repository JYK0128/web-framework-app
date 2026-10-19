# 공통 기능과 인프라

관리자 API와 서비스 API는 실제 자원에 연결되는 공통 기능을 기능별 `infra/` 폴더에 모은다. 각 폴더에는 해당 기능의 서비스, 설정, Nest 모듈, 어댑터를 함께 둔다. `core/`에는 요청 기반 요소와 앱 로깅 서비스 등 외부 자원을 선택하지 않는 공통 앱 코드를 둔다.

| 위치 | 책임 |
| --- | --- |
| `modules/` | 회원 가입·탈퇴, 로그인 허용, 수신자·내용, 미응답 판단 등 업무 정책 |
| `infra/auth/user/` | 사용자 인증 서비스·정책, JWT·토큰·세션 구현 |
| `infra/auth/machine/` | 서비스 간 인증·통신 및 JWT/API Key 구현 |
| `infra/notification/` | 메시지 발송 서비스·템플릿과 SMTP·SMS·Push·Messenger·Webhook 어댑터 |
| `infra/identity/` | 본인인증 처리와 PortOne 어댑터 |
| `infra/alert/` | 운영 알림 처리와 Slack·Discord·Teams·ChannelTalk 어댑터 |
| `infra/realtime/` | 실시간 발행·구독 서비스와 Socket.IO·SSE 어댑터 |
| `core/storage/` | API의 `core.module.ts`에서 `forRoot({ adapter })`에 어댑터 클래스를 직접 지정하며, 구현은 `core/storage/`에서 관리 |
| `infra/database/`, `infra/kv-store/`, `infra/event-broker/` | DB·KV·이벤트 브로커 연결과 구현 선택 |
| `infra/log-telemetry/` | Loki 로그 조회 서비스와 어댑터 |
| `core/services/logger/` | 앱에서 사용하는 로거 API. 로그 수집·저장은 Vector/Loki 인프라가 담당 |
| `core/` | 공통 guard, middleware, interceptor, context, DTO 등 앱 기반 요소 |

기능 폴더 안에서는 서비스와 어댑터를 분리하되, 기능 전체는 같은 `infra/<기능>` 아래에서 찾을 수 있게 한다. `modules/`는 가입·탈퇴나 발송 대상·내용 같은 업무 결정을 맡고, `infra/`는 공통 기능을 실행할 기술과 실제 자원을 구성한다.

`AppModule`이 `InfraModule`과 `CoreModule`을 조합한다. 인증 방식, Machine Auth 대상, 실시간 Redis 연결, 저장소 드라이버, 메시지·운영 알림 제공자를 `infra/infra.module.ts`에서 선택·등록한다. DB·KV·브로커·로그 텔레메트리 등록도 이곳에서 구성한다.

## 사용과 동작

사용자 인증은 기존 `USER_AUTH_SERVICE` 토큰을 사용한다. JWT claim·refresh token 회전·세션 TTL·Machine Auth 계약은 유지한다. OAuth 로그인·계정 복구 등 계정 업무는 `modules/auth`에 둔다.

알림 메시지는 `MessageService.send`로 발송한다. 발송 설정은 기능에서 조회·복호화해 전달한다. `variables`를 명시했을 때만 `{{name}}` 변수를 치환하며 누락된 변수는 오류다. 변수 인자가 없으면 원문을 그대로 전송한다. Webhook은 Slack·Discord·ChannelTalk·Teams 형식 구성과 직접 작성한 payload를 지원한다. 발송 결과를 반환하고 인증 링크 폐기 같은 업무 처리는 기능에서 담당한다. 발송 서비스와 채널 어댑터는 `infra/notification/`에 함께 둔다.

PortOne 결과 검증·전화번호 정규화와 HTTP 호출은 `infra/identity/` 안의 서비스·어댑터가 맡는다. 운영 알림 서비스는 기본 제목과 실패 로깅을 담당하고 제공자 어댑터는 실제 전송을 담당한다. 두 기능은 각각 `infra/alert/`에 둔다.

저장소는 각 API의 `core.module.ts`에서 `forRoot({ adapter })`에 `LocalStorageAdapter` 또는 `S3StorageAdapter`를 직접 지정해 선택한다. S3 인증 정보는 환경변수로 읽으며, 로컬 파일의 HTTP 제공은 각 API의 `main.ts`에서 등록한다. 과거 대화 조회, Socket 실시간 전달, 미응답 배치 알림의 SSE 전달 방식은 유지한다. 발송 이력·템플릿 편집 UI·배치 정책을 새로 추가한 구조 변경은 아니다.

메시지·운영 알림 모듈은 각 `infra/` 기능 폴더 안에서 서비스와 어댑터를 함께 등록한다. 저장소 서비스 토큰은 선택된 어댑터에 직접 연결한다. FCM 액세스 토큰은 설정 지문과 만료 시간을 확인해 재사용하며 동시 발급 요청을 합친다. 외부 발송 결과는 제공자별 성공 조건으로 검사하고 PortOne 응답은 Zod로 검증한다.
