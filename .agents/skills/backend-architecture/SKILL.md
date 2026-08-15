---
name: backend-architecture
description: >-
  Comprehensive guide and rules for the NestJS backend architecture, covering directory structure,
  CQRS handler patterns (identify-verify-process), DtoType entity projection, Unit of Work persistence,
  Guards/Interceptors pipeline, MikroORM data patterns, and Redis security caching.
---

# 백엔드 아키텍처 및 개발 표준 가이드 (NestJS)

본 문서는 `template/nest-starter-kit` 백엔드 프로젝트의 디렉토리 구조, CQRS 비즈니스 패턴, 데이터 영속화, 보안 캐시 규칙을 표(Table) 중심의 개조식으로 정리한 규격서임.

---

## 1. 백엔드 디렉토리 구조

| 디렉토리 경로 | 역할 및 구성 요소 | 주요 파일 및 규칙 |
| :--- | :--- | :--- |
| **`src/modules/`** | 도메인별 기능 모듈 (`auth`, `users`, `roles`, `terms`, `notices`, `faqs`) | 컨트롤러, CQRS `commands/`, `queries/`, `handlers/`, `dto/` |
| **`src/entities/`** | MikroORM 엔티티 정의 | `BaseEntity` 상속, ULID 기본키, 감사 컬럼, 소프트 딜리트 필터 |
| **`src/common/`** | 전역 공통 모듈 및 유틸리티 | 데코레이터, 인터셉터(`unit-of-work`), 가드, Redis, 보안 서비스 |
| **`src/database/`** | 데이터베이스 설정 및 확장 매니저 | `AppEntityManager` (페이징 헬퍼), 시더(`seeders/`) |
| **`src/main.ts`** | 애플리케이션 부트스트랩 | Graceful Shutdown 리스너, 글로벌 파이프/필터/인터셉터 바인딩 |

---

## 2. DTO 설계 및 `DtoType` 패턴

### 2.1. DTO 유형별 작성 표준

| DTO 유형 | 선언 구문 | 역할 및 동작 |
| :--- | :--- | :--- |
| **Request DTO** | `class CreateFaqRequestDto extends DtoType(Faq)` | • 엔티티 필드명/타입 불일치 시 컴파일 에러 감지<br/>• `class-validator`를 통한 입력값 유효성 검증 |
| **Response DTO** | `class NoticeItemDto extends DtoType(Notice)` | • 엔티티 인스턴스를 받아 필요 필드만 선별 투영(Projection)<br/>• `@ApiProperty`를 통한 Swagger 스키마 문서화 |
| **복합 DTO** | `class UserProfileDto extends DtoType(User, Account)` | • 2개 이상의 엔티티 필드 타입을 병합 상속 |

### 2.2. DTO 데코레이터 및 구현 규칙

| 항목 | 표준 규칙 | 예시 코드 |
| :--- | :--- | :--- |
| **스키마 명시** | 클래스 상단 `@ApiSchema({ name: '...' })` 선언 | `@ApiSchema({ name: 'CreateNoticeRequest' })` |
| **필드 문서화** | 모든 프로퍼티에 `@ApiProperty()` 또는 `@ApiEnumProperty()` 선언 | `@ApiProperty({ example: '공지 제목' }) title!: string;` |
| **입력값 검증** | `class-validator` 데코레이터 선언 | `@IsString() @IsNotEmpty() title!: string;` |
| **생성자 투영** | Response DTO는 엔티티 수신 생성자 구현 | `constructor(entity: Notice) { this.id = entity.id; ... }` |

---

## 3. HTTP 진입 및 가드/인터셉터 파이프라인

### 3.1. 컨트롤러 데코레이터 규약

| 적용 위치 | 데코레이터 | 역할 및 동작 규칙 |
| :--- | :--- | :--- |
| **클래스 레벨** | `@ApiTags('name')` | Swagger 문서 도메인 그룹화 |
| | `@Controller('path')` | 기본 라우트 경로 정의 (비즈니스 로직 배제, CQRS 디스패처 역할만 수행) |
| | `@Bypass(...)` | 가드 우회 정책 적용 (`BypassPolicy.PERMISSION`, `BypassPolicy.TERM`) |
| **메소드 레벨** | `@Public()` | 인증 가드(`AuthGuard`) 제외 처리 (로그인, 회원가입 등) |
| | `@Permission('domain:action')` | 요구 권한 명시 (`PermissionGuard`에서 Redis 캐시와 대조 검증) |
| | `@SwaggerApiResponse(Dto, status?)` | 성공 응답 스키마 선언 및 OpenAPI 문서 자동 생성 |
| | `@HttpCode(HttpStatus.OK)` | 생성(201) 외 POST, DELETE 요청에 200 상태코드 지정 |
| **파라미터 레벨** | `@CurrentUser()` | 세션 컨텍스트(Cls)에서 인증된 유저 프로필(`UserProfileResponseDto`) 주입 |
| | `@Body()` / `@Query()` / `@Param()` | 요청 바디, 쿼리 스트링, 경로 변수 바인딩 |

### 3.2. 가드 인가 순서 및 규칙

| 실행 순서 | 가드명 | 검증 기준 및 동작 내용 | 우회 데코레이터 |
| :---: | :--- | :--- | :--- |
| **1** | **`AuthGuard`** | • `AccessToken` 서명 검증<br/>• Redis `auth:blacklist:{jti}` 대조 (로그아웃 즉시 차단)<br/>• Redis `auth:user:{id}` 대조 (밴/탈퇴/권한 검증) | `@Public()` |
| **2** | **`PermissionGuard`** | • Redis `auth:role:{role}` 매핑 캐시와 라우트 요구 권한 대조 | `@Bypass(BypassPolicy.PERMISSION)` |
| **3** | **`TermsAgreementGuard`** | • 세션 유저의 필수 약관 동의 여부 검증 | `@Bypass(BypassPolicy.TERM)` |

### 3.3. Unit of Work 인터셉터 (`flush` 통제 규율)

| 구분 | 적용 대상 | 동작 규칙 |
| :--- | :--- | :--- |
| **일괄 커밋 (기본)** | 모든 정상 요청 종료 시점 | `UnitOfWorkInterceptor`가 `em.flush()`를 1회 일괄 커밋 |
| **`flush` 호출 금지** | 핸들러 비즈니스 성공 경로 | `em.flush()` 직접 호출 금지 (ChangeSet 쓰기 지연 활용) |
| **선별적 예외 플러시** | 계정 잠금, 로그인 실패 카운트 증가 | 예외(`throw`)로 롤백되기 전 기록할 보안 데이터만 `await em.flush()` 호출 |

---

## 4. CQRS 핸들러 메소드 정책: `identify <-> verify -> process`

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

### 5.1. 엔티티 표준 컬럼 및 필터

| 항목 | 표준 구현 규약 | 역할 및 동작 |
| :--- | :--- | :--- |
| **기본키 (PK)** | ULID (`string`) | 시간순 정렬 가능(Time-sortable), 분산 환경 안전한 고유 식별자 |
| **감사 컬럼 (Audit)** | `createdAt`, `updatedAt`, `deletedAt`, `deletedBy` | 모든 엔티티 공통 상속 |
| **소프트 딜리트** | `deletedAt IS NULL` 전역 MikroORM 필터 | 기본 자동 필터링, 관리자 모드에서만 `{ filters: false }` 우회 |

### 5.2. `AppEntityManager` 페이징 메소드

| 메소드 | 반환 타입 | 사용처 및 특징 |
| :--- | :--- | :--- |
| **`em.findByPage(Entity, query, options)`** | `PageResult<T>` (`items`, `total`, `page`, `limit`) | 번호 기반 오프셋 페이징 |
| **`em.findCursor(Entity, query, options)`** | `CursorResult<T>` (`items`, `nextCursor`, `hasNextPage`) | 무한 스크롤 커서 페이징 |

---

## 6. Redis 보안 캐시 관리

| 캐시 키 패턴 | 저장 데이터 | TTL 수명 | 동기화 시점 |
| :--- | :--- | :--- | :--- |
| **`auth:user:{userId}`** | 밴, 탈퇴, 2FA, 비밀번호 변경일, 권한 | 10분 | 유저 상태 변경 핸들러 실행 시 즉시 `DEL` |
| **`auth:blacklist:{jti}`** | 블랙리스트 플래그 (`"1"`) | 토큰 잔여 수명 | 로그아웃 시 등록 ➔ 토큰 만료 전까지 재사용 차단 (`401 INVALID_TOKEN`) |
| **`auth:role:{roleName}`** | 역할별 권한 매핑 목록 | 1시간 | 역할 권한 수정 시 즉시 `DEL` |

---

## 7. 코드 품질 및 네이밍 규약

| 구분 | 표준 규칙 | 세부 가이드 및 예시 |
| :--- | :--- | :--- |
| **지양 네이밍** | 부차적/기계적 수식어 배제 | `targetUser`, `targetNotice`, `selectedRole`, `userData`, `noticeItem`, `faqObj` |
| **권장 네이밍** | 도메인의 본질 명사 사용 | `user`, `notice`, `faq`, `term`, `group`, `role` |
| **예외 네이밍** | 문맥상 구분이 필요한 경우만 한정 | `currentUser`(세션 사용자) vs `user`(작업 대상), `source` vs `destination` |
| **순수 생성자 주입** | `@Inject()` 전면 배제 | `constructor(private readonly em: AppEntityManager) {}` (Auto-wiring) |
