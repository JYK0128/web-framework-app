# 약관 외 도메인 정비 검토

2026-10-13. 관리자 API의 도메인 구성·DTO import와 대응 서비스 API의 수정 입력 검증을 검토했다.

## 구조 정비

| 도메인 | 결과 |
| --- | --- |
| customers | profile / account / membership / sessions 컨트롤러와 모듈로 분리. 마스킹 조회와 개인정보 원문 조회의 권한 차이 유지. |
| operators | profile / account / access로 컨트롤러·CQRS 핸들러 등록을 분리. 공통 보호 규칙과 응답 DTO는 루트에서 공유. |
| support | rooms / messages / realtime / notification으로 분리. 소켓 게이트웨이는 realtime, 알림 구독은 notification 모듈에서 등록. 마스킹 로직은 공통 함수로 유지. |
| events / faqs / health / logs / memberships / notices / permissions / qna / roles | 한 책임에 집중된 기존 모듈 구성 유지. DTO 배럴을 제거하고 직접 import. |
| auth / service-config / system-config / terms / service-terms | 앞선 정비의 하위 기능별 모듈 구성 유지. |

컨트롤러를 분리한 API는 기존 operation ID를 명시해 생성 클라이언트 함수 이름을 유지했다. 기존 121개 HTTP 작업의 경로·인증·권한·상태 메타데이터와 Swagger 작업 정의를 분리 전후 비교했다.

## 동작 수정

- 공지·이벤트·FAQ의 PATCH DTO에서 생성 기본값 상속 제거. 제목·질문만 수정해도 게시 상태, 중요도, 고정 여부, 정렬값이 덮어써지던 문제를 관리자/서비스 양쪽에서 수정.
- 공지·이벤트·FAQ·역할·멤버십·Q&A·상담의 수정 입력은 생략과 유효한 값을 구분하고, nullable로 정의하지 않은 필드의 null을 거부.
- 멤버십 생성/수정 권한 입력은 문자열 배열만 허용. 문자열 하나가 문자열 배열 검증을 통과해 정규화 과정에서 실패하던 문제 수정.
- 이벤트 이미지·링크와 Q&A 담당자의 명시적 null 해제 동작 유지.

## 검증

- `pnpm --filter admin-api test:domain-structure`: 실제 Nest 하위 모듈 초기화·CQRS 연결, 정적 경로 우선순위, 개인정보 마스킹, 소켓 티켓 조회 실패 및 일회성 사용, 관리자 입력 검증.
- `pnpm --filter service-api test:content-update`: 실제 엔티티 객체와 수정 핸들러로 부분 수정 후 상태 보존·명시적 변경 및 서비스 입력 검증.
- Swagger 요청·응답 스키마 비교 후 관리자 API 클라이언트 재생성. 수정 DTO의 불필요한 기본값 제거만 계약에 반영.
- DB 스키마·마이그레이션 변경 없음.

## 서비스 API 후속 구조 정비

서비스 API에도 동일한 책임 구분을 적용했다.

| 도메인 | 결과 |
| --- | --- |
| customers | profile / account / membership / sessions별 컨트롤러·모듈·DTO·CQRS 분리. |
| memberships | 내부 고객 멤버십 CRUD·권한 조회를 독립 도메인으로 이동. 고객 상세 경로보다 정적 멤버십 경로를 먼저 등록. |
| support | rooms / messages / realtime / notification별 모듈 분리. 상담방·메시지·소켓 티켓 서비스도 분리. 방 접근 확인은 rooms가 소유하고 다른 기능이 재사용. |
| service-terms | documents / groups / agreements / revisions별 공개·내부 컨트롤러와 핸들러 등록 분리. |
| faqs | 내부 FAQ 컨트롤러와 핸들러를 FAQ 모듈로 이동. |
| events / notices / qna 등 | 묶음 DTO·Command/Query·Handler 파일을 개별 파일로 분리. 공유 검증/조회 함수만 helpers에 유지. |

`internal` 통합 모듈과 도메인 배럴 10개를 제거했다. 대응 도메인의 직접 import로 교체했다. 동일 요청·응답에 속한 중첩 DTO는 한 파일에 유지한다.

공개 API 47개의 Swagger 작업·스키마와 전체 101개 경로의 인증·상태 메타데이터를 분리 전후 비교했다. 계약 변화가 없어 생성 클라이언트 재생성은 필요하지 않다. 실제 Nest 하위 모듈을 production DomainModule 순서로 초기화하는 회귀 테스트를 추가해 CQRS 연결·정적 경로 우선순위·고객 세션 소유 확인·상담방 접근/읽음 처리·닫힌 방 전송 차단·소켓 티켓 일회성 사용을 확인한다. 게이트웨이 1개, 스케줄러 작업 2개, 상담 알림 이벤트 처리 1회 등록도 검증한다.

후속 정비 검증: 전체 린트·타입 검사와 변경된 테스트 소스 타입 검사 통과. 서비스 회귀 테스트 9개 통과, 별도 PostgreSQL이 필요한 테스트 1개는 미실행. DB 스키마·마이그레이션 변경 없음.
