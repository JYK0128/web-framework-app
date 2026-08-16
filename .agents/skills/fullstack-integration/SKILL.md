---
name: fullstack-integration
description: >-
  Comprehensive guide and architectural specification for the entire repository,
  covering backend CQRS patterns (identify-verify-process), DtoType and SearchableRequestDto,
  Unit of Work persistence, Guard/Interceptor pipeline, Redis security mesh,
  BFF Nitro session proxy, TanStack Router route guards, and Schema-Driven SSOT integration.
---

# 풀스택 아키텍처 및 개발 표준 가이드

본 문서는 `web-framework-app` 프로젝트의 백엔드, 프론트엔드/BFF, 데이터 계층 전반의 아키텍처 규칙을 일목요연하게 정리한 규격서임.

---

## 1. 프로젝트 디렉토리 구조

| 계층 | 디렉토리 경로 | 주요 역할 및 구성 |
| :--- | :--- | :--- |
| **백엔드**<br/>(`nest-starter-kit`) | **`src/modules/`** | 도메인별 기능 모듈 (`auth`, `users`, `roles`, `terms`, `notices`, `faqs`) |
| | **`src/entities/`** | MikroORM 엔티티 (`BaseEntity` 상속, ULID PK, 감사 컬럼, 소프트 딜리트) |
| | **`src/common/`** | 전역 공통 모듈 (가드, 인터셉터, CLS 컨텍스트, Redis 캐시, 공통 DTO) |
| | **`src/database/`** | DB 설정, `AppEntityManager` (페이징 헬퍼), 초기 시더(`seeders/`) |
| **프론트엔드 & BFF**<br/>(`react-starter-kit`) | **`server/`** | Nitro BFF 서버 (세션 쿠키 검증, API 프록시, Redis 세션, Silent Refresh) |
| | **`src/routes/`** | TanStack Router 파일 기반 라우팅 (`_protected/route.tsx` 인가 가드) |
| | **`src/.generated/`** | Orval 자동 생성 코드 (`api/` Query 훅, `zod/` 검증 스키마) |
| | **`src/components/`** | 공통 UI 컴포넌트 (`data-grid`, `form`, `layout`, `app`) |

---

## 2. DTO 설계 및 조회 조건 스키마 규약

### 2.1. DTO 유형별 작성 표준

| DTO 유형 | 선언 구문 | 작성 규칙 및 동작 |
| :--- | :--- | :--- |
| **Request DTO** | `class CreateFaqRequestDto extends DtoType(Faq)` | 엔티티 필드 타입 상속 + `class-validator` 입력값 검증 |
| **Response DTO** | `class NoticeItemDto extends DtoType(Notice)` | 엔티티 인스턴스를 받아 필요한 필드만 선별 투영 + `@ApiProperty` |
| **복합 DTO** | `class UserProfileDto extends DtoType(User, Account)` | 2개 이상의 엔티티 필드 타입을 병합 상속 |

### 2.2. 공통 조회 조건 DTO 규약 (`src/common/interfaces/request/`)

| 베이스 DTO 클래스 | 선언 구문 | 변환 헬퍼 메소드 | 담당 역할 및 파라미터 |
| :--- | :--- | :--- | :--- |
| **`PageRequestDto<T, TSort>`** | `class GetXxxRequestDto extends PageRequestDto<Entity, SortKey>` | `toPageOptions()`, `toFilterQuery()` | 번호 기반 오프셋 페이징 (`search`, `page`, `limit`, `sort`, `direction`, `filters`) |
| **`CursorRequestDto<T, TSort>`** | `class GetXxxFeedRequestDto extends CursorRequestDto<Entity, SortKey>` | `toCursorOptions()`, `toFilterQuery()` | 무한 스크롤 커서 페이징 (`search`, `cursor`, `limit`, `sort`, `direction`, `filters`) |
| **`SearchableRequestDto<T, TSort>`** | `abstract class SearchableRequestDto<Entity, SortKey>` | `toSearchQuery()` | 최상위 통합 검색 (`search?: string`, `searchFields: (keyof T)[]`, 일반 LIKE + 한글 초성 정규식(`$re`) + 영타 오타 자동 변환 지원) |
| **`FilterableRequestDto<T>`** | `class GetXxxFiltersDto extends FilterableRequestDto<Entity>` | `toFilterQuery()` | 순수 도메인별 조건 필터링 (`role`, `category`, `status` 등) |

---

## 3. 컨트롤러 계층 및 보안/트랜잭션 파이프라인

### 3.1. 컨트롤러 데코레이터 규약

| 적용 위치 | 데코레이터 | 역할 및 동작 규칙 |
| :--- | :--- | :--- |
| **클래스 레벨** | `@ApiTags('name')` | Swagger 문서에서 도메인 그룹화 |
| | `@Controller('path')` | 기본 라우트 경로 정의 (비즈니스 로직 배제, CQRS 버스 디스패처 역할만 수행) |
| | `@Bypass(...)` | 컨트롤러 전체에 가드 우회 적용 (`BypassPolicy.PERMISSION`, `BypassPolicy.TERM`) |
| **메소드 레벨** | `@Public()` | 인증 가드(`AuthGuard`) 제외 처리 (로그인, 회원가입 등) |
| | `@Permission('domain:action')` | 요구 권한 명시 (`PermissionGuard`에서 Redis 캐시와 대조 검증) |
| | `@SwaggerApiResponse(Dto, status?)` | 성공 응답 스키마 선언 및 OpenAPI 문서 자동 생성 |
| | `@HttpCode(HttpStatus.OK)` | 생성(201) 외 POST, DELETE 요청에 200 상태코드 지정 |
| **파라미터 레벨** | `@CurrentUser()` | 세션 컨텍스트(Cls)에서 인증된 유저 프로필(`UserProfileResponseDto`) 주입 |
| | `@Body()` / `@Query()` / `@Param()` | 요청 바디, 쿼리 스트링, 경로 변수 바인딩 |

### 3.2. 가드 인가 순서 및 규칙

| 실행 순서 | 가드명 | 검증 기준 및 동작 내용 | 우회 데코레이터 |
| :---: | :--- | :--- | :--- |
| **1** | **`AuthGuard`** | • `AccessToken` 서명 검증<br/>• Redis `auth:blacklist:{jti}` 대조 (로그아웃 즉시 차단)<br/>• Redis `auth:user:{id}` 대조 (밴/탈퇴/권한 상태 검증) | `@Public()` |
| **2** | **`PermissionGuard`** | • Redis `auth:role:{role}` 매핑 캐시와 라우트 요구 권한 대조 | `@Bypass(BypassPolicy.PERMISSION)` |
| **3** | **`TermsAgreementGuard`** | • 세션 유저의 필수 약관 동의 여부 검증 | `@Bypass(BypassPolicy.TERM)` |

### 3.3. Unit of Work 인터셉터 (`flush` 통제 규율)

| 구분 | 적용 대상 | 동작 규칙 |
| :--- | :--- | :--- |
| **일괄 커밋 (기본)** | 모든 정상 요청 종료 시점 | `UnitOfWorkInterceptor`가 `em.flush()`를 1회 일괄 커밋 |
| **`flush` 호출 금지** | 핸들러 비즈니스 성공 경로 | `em.flush()` 직접 호출 금지 (MikroORM ChangeSet 쓰기 지연 활용) |
| **선별적 예외 플러시** | 계정 잠금, 로그인 실패 카운트 증가 | 예외(`throw`)로 롤백되기 전 반드시 기록할 보안 데이터만 `await em.flush()` 호출 |

---

## 4. CQRS 핸들러 메소드 규약: `identify <-> verify -> process`

### 4.1. 3단계 라이프사이클 규칙

| 단계 | 메소드명 | 주요 작업 | 부수 효과 | 에러 처리 규칙 |
| :--- | :--- | :--- | :---: | :--- |
| **1단계** | **`identify*`** | DB 및 세션에서 대상 엔티티/데이터 조회 | 없음 | 미존재 시 `NOT_FOUND` 예외 발생 |
| **2단계** | **`verify*`** | 비즈니스 규칙, 권한, 상태 전이 조건, 만료일 검증 | 없음 | 조건 불만족 시 `ApplicationError` 발생 (필요 시 `identify`와 상호 교차 호출) |
| **3단계** | **`process`** | 엔티티 필드 수정/생성, Redis 캐시 무효화, DTO 반환 | 있음 (상태 변경 및 캐시 삭제) | 검증 완료 데이터만 처리 |

### 4.2. CQRS 3요소 타입 계약

| 구성 요소 | 선언 구문 | 구현 규칙 및 특징 |
| :--- | :--- | :--- |
| **Command** | `class DoCommand extends Command<ResultDto>` | 상태 변경 작업. 반환 DTO 타입을 제네릭으로 명시 |
| **Query** | `class GetQuery extends Query<ResultDto>` | 상태 조회 작업. 반환 DTO 타입을 제네릭으로 명시 |
| **CommandHandler** | `@CommandHandler(DoCommand)`<br/>`implements ICommandHandler<DoCommand, ResultDto>` | • `execute(cmd): Promise<ResultDto>` 시그니처 구현<br/>• `identify-verify-process` 3단계 메소드 구조 준수 |
| **QueryHandler** | `@QueryHandler(GetQuery)`<br/>`implements IQueryHandler<GetQuery, ResultDto>` | • `execute(query): Promise<ResultDto>` 시그니처 구현<br/>• `identify-verify-process` 3단계 메소드 구조 준수 |

---

## 5. 데이터베이스 및 엔티티 규약 (MikroORM)

| 항목 | 표준 구현 규약 | 역할 및 동작 |
| :--- | :--- | :--- |
| **기본키 (PK)** | ULID (`string`) | 시간순 정렬 가능(Time-sortable), 분산 환경 안전한 고유 식별자 |
| **감사 컬럼 (Audit)** | `createdAt`, `updatedAt`, `deletedAt`, `deletedBy` | 모든 엔티티 공통 상속 |
| **소프트 딜리트** | `deletedAt IS NULL` 전역 MikroORM 필터 | 기본 자동 필터링, 관리자 모드에서만 `{ filters: false }` 우회 |
| **페이징 메소드** | `em.findByPage(Entity, query, options)`<br/>`em.findCursor(Entity, query, options)` | 번호 기반(`PageResult<T>`) 및 커서 기반(`CursorResult<T>`) 페이징 일원화 |

---

## 6. Redis 보안 캐시 및 BFF 세션 관리

### 6.1. 4대 캐시 키 규격 및 실시간 동기화

| 캐시 키 패턴 | 저장 데이터 | TTL 수명 | 동기화 시점 |
| :--- | :--- | :--- | :--- |
| **`auth:user:{userId}`** | 밴, 탈퇴, 2FA, 비밀번호 변경일, 권한 | 10분 | 유저 상태 변경 핸들러 실행 시 즉시 `DEL` |
| **`auth:blacklist:{jti}`** | 블랙리스트 플래그 (`"1"`) | 토큰 잔여 수명 | 로그아웃 시 등록 ➔ 토큰 만료 전까지 재사용 차단 (`401 INVALID_TOKEN`) |
| **`auth:role:{roleName}`** | 역할별 권한 매핑 목록 | 1시간 | 역할 권한 수정 시 즉시 `DEL` |
| **`session:{sessionId}`** | AccessToken, RefreshToken | 30일 | AccessToken 만료 15초 전 BFF 미들웨어가 `/auth/token/refresh`로 자동 연장 |

### 6.2. BFF 세션 프록시 계층 구조

| 통신 구간 | 전달 데이터 / 프로토콜 | 보안 및 처리 내용 |
| :--- | :--- | :--- |
| **브라우저 ↔ BFF** | HttpOnly Cookie (`session_id`) | 브라우저 JS의 실제 토큰 접근 차단 (XSS 방어) |
| **BFF ↔ Redis** | Memory Lookup (`session:{id}`) | 세션 ID로 Redis에서 AccessToken 및 RefreshToken 획득 |
| **BFF ↔ 백엔드 API** | HTTP Header (`Bearer <Token>`) | 백엔드로 AccessToken 프록시 전달 (`server/middleware/01.proxy.ts`) |
| **BFF Silent Refresh** | 백엔드 `POST /auth/token/refresh` | AccessToken 만료 15초 전 백그라운드 자동 갱신 (`server/middleware/02.session.ts`) |

---

## 7. 프론트엔드 라우팅 및 폼 검증

| 기능 영역 | 적용 방식 | 구현 내용 및 기대 효과 |
| :--- | :--- | :--- |
| **라우트 가드** | TanStack Router (`_protected/route.tsx`) | `beforeLoad`에서 세션, 필수 약관 동의, 요구 권한 대조 검증 |
| **검색 파라미터** | TanStack Router (`validateSearch`) | 최상위 `search`, `page`, `limit`, `sort`, `direction` 및 `filters` 1:1 매핑 |
| **폼 유효성 검증** | `react-hook-form` + `zodResolver` | Orval이 자동 생성한 Zod 스키마(`src/.generated/api/zod/**`) 바인딩 |
| **캐시 무효화** | `queryClient.invalidateQueries({ queryKey })` | Mutation 성공 시 Orval 생성 쿼리키 헬퍼를 통한 화면 데이터 최신화 |

---

## 8. Schema-Driven SSOT 파이프라인 및 개발 워크플로우

### 8.1. 4단계 SSOT 코드 생성 파이프라인

| 단계 | 산출물 / 위치 | 도구 및 방식 | 역할 및 기대효과 |
| :---: | :--- | :--- | :--- |
| **Step 1** | 백엔드 DTO, Entity, Controller | NestJS + `DtoType` + `@ApiProperty` | 단일 진실 원천(SSOT) 데이터 스키마 정의 |
| **Step 2** | OpenAPI 스펙 (`/api/v1/docs-json`) | NestJS Swagger Plugin | 기계 판독 가능한 표준 REST 스펙 생성 |
| **Step 3** | 프론트엔드 API 클라이언트 코드 | `pnpm --filter react-starter-kit gen:api` (Orval) | TypeScript 인터페이스, TanStack Query 훅, Zod 스키마 자동 생성 |
| **Step 4** | UI 컴포넌트 (`src/routes/**`) | `useXxxQuery`, `useXxxMutation` | 수동 API 코드 작성 배제 및 컴파일 타임 타입 검증 확보 |

### 8.2. 신규 기능 개발 5단계 엔드투엔드 워크플로우

| 순서 | 개발 영역 | 주요 작업 내용 | 필수 준수 규칙 |
| :---: | :--- | :--- | :--- |
| **1** | **백엔드 DTO & 엔티티** | 엔티티 선언, DTO 작성 (`extends DtoType(...)`) | `@ApiSchema`, `@ApiProperty`, `class-validator` 선언 |
| **2** | **백엔드 CQRS 핸들러** | Command/Query 정의 및 Handler 구현 | `identify <-> verify -> process` 3단계 메소드 준수 |
| **3** | **백엔드 컨트롤러** | 라우트 데코레이터 및 버스 위임 선언 | `@SwaggerApiResponse(DtoClass)`, `@Permission` 선언 |
| **4** | **API 클라이언트 생성** | `pnpm --filter react-starter-kit gen:api` 실행 | Orval 생성 파일(`src/.generated/`) 확인 |
| **5** | **프론트엔드 화면 연동** | 생성된 `useXxx()` 훅과 `validateSearch`로 UI 컴포넌트 바인딩 | `queryClient.invalidateQueries()` 캐시 갱신 연동 |

---

## 9. 클린 도메인 네이밍 및 의존성 주입 규약

| 구분 | 표준 규칙 | 세부 가이드 및 예시 |
| :--- | :--- | :--- |
| **지양 네이밍** | 부차적/기계적 수식어 배제 | `targetUser`, `targetNotice`, `selectedRole`, `userData`, `noticeItem`, `faqObj` |
| **권장 네이밍** | 도메인의 본질 명사 사용 | `user`, `notice`, `faq`, `term`, `group`, `role` |
| **예외 네이밍** | 문맥상 구분이 필요한 경우만 한정 | `currentUser`(세션 사용자) vs `user`(작업 대상), `source` vs `destination` |
| **순수 생성자 주입** | `@Inject()` 전면 배제 | `constructor(private readonly em: AppEntityManager) {}` (Auto-wiring) |

---

## 10. 전체 검증 파이프라인

```bash
# 1. 전체 패키지 타입 검사
pnpm -r typecheck

# 2. 전체 패키지 린트 검사
pnpm -r lint

# 3. 백엔드 빌드 검증
pnpm --filter nest-starter-kit build

# 4. 프론트엔드 API 클라이언트 동기화 검증
pnpm --filter react-starter-kit gen:api
```
