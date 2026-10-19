# Request / Response DTO 정비

2026-10-13. 관리자 API와 대응 서비스 API의 HTTP 컨트롤러를 조사했다.

## 적용 범위

| 범위 | 확인 결과 |
| --- | --- |
| admin-api | 일반 JSON 응답 작업 116개의 작업별 Request / Response 쌍 연결 확인 |
| service-api | Swagger 응답을 선언한 JSON 작업 92개의 작업별 쌍 연결 확인 |
| service-api 내부 시스템 설정 | Swagger에서 제외된 설정 조회·수정·알림 테스트 설정·동기화·업로드 URL 발급 5개 작업의 반환 타입과 DTO 쌍 명시 |

고객·운영자·멤버십·공지·이벤트·FAQ·Q&A·고객지원·권한·역할·로그·설정·약관과 상태 점검을 포함한다. 기존에 쌍이 있는 작업은 유지하고, 공용 Item/Page/List 응답으로 노출되던 작업에 작업별 Response DTO를 연결했다. 공통 필드와 엔티티 매핑은 기존 DTO를 상속해 재사용한다.

- 개인정보 원문 목록/상세와 마스킹 조회의 Request / Response 이름을 구분했다. 권한과 마스킹 정책은 유지했다.
- 경로만 받는 작업도 Request DTO로 경로 식별자를 구성한다. HTTP 요청 본문은 추가하지 않았다.
- 입력 없는 CQRS 작업은 빈 Request DTO를 메시지에 전달한다. 직접 연동하는 작업은 빈 Request DTO를 기본 입력으로 받는다. 검증 필드가 없는 객체에 불필요한 class-validator 검증을 호출하지 않는다.
- Q&A 목록은 `GetQnasRequestDto` / `GetQnasResponseDto`, 상세는 `GetQnaRequestDto` / `GetQnaResponseDto`로 구분했다. 사용자 소유 상세는 `GetOwnQna` 쌍을 사용한다.
- Command/Query 제네릭과 Handler 반환 타입을 작업별 Response DTO에 맞췄다.
- 2단계 로그인 컨트롤러의 Swagger/반환 타입을 핸들러가 이미 반환하던 `TwoFactorLoginResponseDto`로 맞췄다. 실제 응답 동작은 동일하고, 문서에는 완료 상태의 `requiresTwoFactor: false`를 정확히 표시한다.
- 양쪽 웹 생성 클라이언트를 재생성하고 설정 화면 및 약관 동의 캐시의 모델 참조를 갱신했다.

## 전송 형태를 유지한 예외

OAuth 리다이렉트, SSE, OAuth 아이콘 바이너리 업로드/다운로드는 일반 JSON DTO 쌍을 강제하지 않는다. 기존 전송 계약을 유지한다.

내부 시스템 설정 조회는 동적 키의 객체, 수정은 최상위 문자열 배열을 반환한다. 각각 이름 있는 Response 타입을 사용하며, 객체 래퍼를 추가해 기존 JSON 형태를 바꾸지 않는다. 로그인 사용자·권한과 같은 신뢰된 서버 문맥을 클라이언트 Request DTO로 옮기지 않는다.

## 검증

관리자 API Swagger의 118개 공개 작업을 참조 스키마까지 펼쳐 비교했다. 2단계 로그인 문서 정정 외에는 경로·작업 ID·권한·요청/응답 형태 차이가 없다. 두 웹 클라이언트는 각 API 소스에서 생성한 Swagger로 재생성했다.

전체 린트·타입 검사 및 테스트 소스 타입 검사 통과. 고객지원/개인정보/부분 수정/시스템 설정/서비스 약관 회귀 테스트 18개 통과. 공지·이벤트의 공개 초안 조회 차단과 삭제 후 재삭제 거부도 확인했다. 별도 DB가 필요한 PostgreSQL 테스트 1개는 이번 실행에서 건너뛰었다. DB 스키마와 마이그레이션 변경은 없다.
