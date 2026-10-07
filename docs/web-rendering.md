# TanStack Start 렌더링과 실행

서비스 웹과 운영자 웹은 TanStack Start와 Nitro를 사용한다. 개발은 `pnpm dev`로 Vite와 HMR을 실행하고, 운영은 `NODE_ENV=production pnpm build` 후 `pnpm start`로 `.output/server/index.mjs`를 실행한다. Express와 별도 서버 번들은 사용하지 않는다.

페이지 프리렌더는 사용하지 않는다. 최초 페이지 요청은 Start SSR로 처리하며, SSR은 Nitro 재번들링 시 초기화 순서 오류를 피하도록 단일 청크로 생성한다.

Nitro는 `.output/public`의 JS·CSS 등 정적 파일과 Start SSR을 제공한다. `/profile`도 다른 페이지와 동일하게 인증 검사와 본문 렌더링에 기본 SSR을 사용한다.

`src/routes/api/$.ts`는 `API_BASE_URL`로 요청을 프록시한다. 메서드, 본문, 인증 헤더와 쿠키를 전달하며 응답 스트림과 Set-Cookie를 유지한다. 상태 변경 API에는 `src/start.ts`의 Start 기본 CSRF 미들웨어로 동일 출처 검사를 적용한다. 상태 확인은 `/api/v1/health/ready` 프록시를 사용한다.

SSR 인증은 요청별 refresh 쿠키로 사용자와 온보딩 상태를 조회하고 갱신 쿠키를 응답에 포함한다. accessToken은 서버 함수 내부에서만 사용하며 브라우저 토큰은 Axios와 Jotai로 관리한다.

SSR은 서버 엔트리에서 요청별 nonce를 생성해 Start context와 Router에 전달한다. 개발 CSP는 React Refresh 스크립트를 위해 unsafe-inline을 허용한다. next-themes에는 Router nonce를 전달한다.

개발 Docker는 기존 3000/13000 포트에서 `pnpm dev`를 실행한다. Compose watch가 소스를 동기화하고 Vite가 HMR을 처리한다. 운영 Docker는 웹 앱의 `.output`을 배포하며 API 앱의 `dist/main.js` 실행은 유지한다. 필요한 환경변수는 PORT와 API_BASE_URL이다.

프로덕션 검증은 빌드한 앱을 실행하고 APP_BASE_URL을 지정해 Playwright를 실행한다. `rendering.spec.ts`는 홈 요청별 SSR nonce, SSR 로그인과 hydration, SSR 프로필 및 내부 이동을 확인한다. 인증 회귀 테스트는 SSR 요청 격리와 쿠키 갱신을 확인한다.


API 프록시는 Start 서버 라우트로 처리하고, 서버 폴더에는 보안 플러그인과 `/api/**`를 Start로 전달하는 Nitro 진입 라우트를 둔다. 명시적인 API 진입 라우트는 개발 서버가 `.png` 등 확장자를 정적 파일로 분류해 API를 건너뛰는 것을 방지한다. 백엔드 프록시와 CSRF 검사는 기존 Start 처리에서 수행한다. 별도 상태 확인 라우트와 Node 런타임 진입점은 사용하지 않고 Nitro 기본 Node 서버로 실행한다.
