# iOS 시뮬레이터 소프트웨어 키보드 테스트

`test:ios-keyboard`는 `raw-viewport-test`를 Vite로 실행하고, Appium XCUITest로 iOS Simulator의 Safari를 제어합니다. 지정된 인풋을 실제 네이티브 탭으로 포커스한 뒤 다음 두 조건을 모두 확인합니다.

- 인풋이 `document.activeElement`인지
- Appium의 `isKeyboardShown` 결과가 `true`인지

## 최초 설정

macOS에서 Xcode와 iOS Simulator를 설치한 뒤 Appium과 XCUITest 드라이버를 설치합니다.

```sh
npm install --global appium
appium driver install xcuitest
```

## 실행

루트 디렉터리에서 실행합니다.

```sh
pnpm test:ios-keyboard
```

기본값은 부팅된 iPhone 시뮬레이터, `http://127.0.0.1:5174`, `#content-top-input`입니다. 시뮬레이터가 여러 대라면 다음처럼 지정할 수 있습니다.

```sh
pnpm test:ios-keyboard -- --device "iPhone 17" --selector "#content-bottom-input"
```

이미 실행 중인 URL과 Appium 서버를 사용하려면 Vite 서버 자동 실행을 끕니다.

```sh
pnpm test:ios-keyboard -- \
  --no-server \
  --url http://127.0.0.1:5174 \
  --appium-port 4723
```

Appium 세션에는 `forceSimulatorSoftwareKeyboardPresence=true`와 `connectHardwareKeyboard=false`가 설정되어 있어, Mac의 하드웨어 키보드 연결 상태 때문에 소프트웨어 키보드가 생략되지 않도록 합니다. 실패하면 진단용 스크린샷이 `tmp/ios-soft-keyboard-test/`에 저장됩니다.
