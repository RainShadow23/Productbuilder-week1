# Blueprint: Web Application Suite

## 1. Project Overview

This project is a multi-page web application suite providing several distinct tools. It started as a simple lottery number generator and has since expanded to include a sophisticated "Water Down Calculator" for cryptocurrency traders and a basic contact page. The entire project is built with vanilla HTML, CSS, and modern JavaScript, and it runs within the Firebase Studio environment.

## 2. Live Applications

The project consists of the following pages:

- **[Home Page (`index.html`)](./index.html)**: A central navigation hub linking to the other tools.
- **[Water Down Calculator (`water_down_calculator.html`)](./water_down_calculator.html)**: The primary application for calculating cryptocurrency portfolio averages.
- **[Lotto Number Generator (`lottery.html`)](./lottery.html)**: A tool for generating random lottery numbers.
- **[Contact Page (`contact.html`)](./contact.html)**: A simple contact information page.

## 3. Core Technologies

- **Frontend**: HTML5, CSS3, Modern JavaScript (ES6+).
- **Frontend**: HTML5, CSS3, Modern JavaScript (ES6+ Modules).
- **Testing**: Jest (Unit Testing for calculation logic).
- **Package Management**: npm.
- **API Proxy**: A Cloudflare Worker (`worker.js`) is used to bypass CORS issues when fetching data from the public Upbit API.
- **Development Environment**: Firebase Studio.

## 4. Application Details

### 4.1. Water Down Calculator (`water_down_calculator.html`)

This is the project's core feature, designed to help users calculate the impact of additional cryptocurrency purchases on their portfolio's average price.

**Key Features (Main Calculator):**

- **Real-time Price Fetching**: Fetches the current KRW-BTC price from the Upbit API, auto-refreshing every 30 seconds.
- **Dual Calculation Modes**: "Exchange Mode" and "Wallet Mode" for different average cost calculations.
- **Complex Transaction Handling**: Supports a dynamic list of buy/sell transactions.
- **Data Persistence & Sharing**: Uses `localStorage` to save state and allows sharing exact calculations via a URL parameter.

---

### 4.2. Helper Calculators (Real-time UX Overhaul)

The two "what-if" calculators at the bottom of the page have been completely refactored for a modern, real-time user experience.

**Key Features:**

- **Real-time, Button-Free Calculation**:
  - All results are updated **instantly** as the user types in any of the relevant input fields.
  - The dedicated "Calculate" buttons have been removed for a seamless, interactive experience.

- **"이렇게 물을 타면 내 평단가는?" (What-if Average Price)**:
  - **Profit/Loss Rate (%) Display**: When calculating the new average price, the UI now also displays the profit/loss percentage relative to the "additional purchase price".
  - **Dynamic Color-Coding**: The P/L rate is colored **red** for profit (`+`) and **blue** for loss (`-`), adhering to Korean financial app standards.
    - Example: `예상 평단가: 30,000 KRW (-5.2%)`
  - **Calculation**: `pnlRate = ((purchasePrice / newAvgPrice) - 1) * 100`

- **"구조대(목표 평단)가 오려면?" (Required Amount for Target Price)**:
  - Instantly calculates the total investment required to reach a desired average price.

- **Enhanced Readability and Input Formatting**:
  - **Decimal Styling**: All numeric results are formatted to improve readability. The integer part is large and bold, while the decimal part is smaller and lighter (`.dec-part` style).
  - **Automatic Thousand Separators**: All numeric inputs automatically format with commas (`,`) as the user types, improving usability for large numbers.
  - **Clear Units**: Units like "KRW" are now fixed text placed outside the input fields, preventing user input errors.

---

### 4.3. Lotto Number Generator (`lottery.html`)

A simple tool for generating and tracking lottery numbers.

- **Features**: Generates 6 unique random numbers between 1 and 45 and maintains a session history.

### 4.4. General Style & Structure

- **Theme**: A dark/light mode theme toggle is available and its state is persisted in `localStorage`.
- **Code Structure**: Logic is separated to ensure new features don't break existing ones. The new real-time calculator logic runs in a separate `<script>` tag and safely observes changes from the main `main.js` script (like the fetched BTC price) without direct interference.

## 5. Most Recent Change (Summary)

- **Task**: 목표 평단가 자동 계산 및 계산 입력값 저장 기능 추가
- **Task**: 코드 리팩토링 및 유닛 테스트 도입 (Jest)
- **Changes Applied**:
  1. **로직 분리 (Refactoring)**:
     - 복잡한 계산 로직을 `main.js`에서 분리하여 순수 함수 형태의 `calculation-logic.js` 모듈로 이전했습니다.
     - `main.js`는 이제 UI 이벤트 처리와 DOM 조작에만 집중합니다.
     - 모든 스크립트 태그를 `type="module"`로 변경하여 최신 모듈 시스템을 적용했습니다.
  2. **유닛 테스트 구축 (Unit Testing)**:
     - `Generic JavaScript Testing Framework`인 **Jest**를 도입했습니다.
     - `calculation-logic.test.js` 파일을 생성하여 핵심 계산 로직(물타기, 목표 평단가 등)에 대한 자동화 테스트 케이스 7개를 작성했습니다.
     - 터미널에서 `npm test` 명령어로 언제든지 계산 정확성을 검증할 수 있습니다.
  3. **프로젝트 현대화**:
     - `package.json` 도입으로 의존성 관리 시작.
     - ES Modules 구조로 전환.
  4. **목표 평단가 자동 계산**:
     - What-if 계산과 동일한 UX 패턴 적용 (디바운싱 500ms)
     - 입력 시 자동 계산, 버튼 클릭 시 즉시 계산
     - 일관된 사용자 경험 제공
  5. **계산 관련 입력값 저장**:
     - 계산 기준 가격 (얼마에 더 살까요)
     - What-if 추가 매수 금액
     - 목표 평단가 입력값
  6. **UI 개선**:
  - **물타기 시뮬레이션 시각화**: 예상 평단가와 현재 평단가를 비교하는 막대 그래프 추가.
  - **확대(Zoomed) 모드**: 미세한 변화(1~2%)도 직관적으로 인식할 수 있도록 최소/초대 가격 범위를 동적으로 조절하는 그래프 로직 적용.

- **Developer Context**: 사용자가 물타기 계산 시 입력한 값들을 코인별로 저장하여, 코인을 전환했다가 돌아와도 이전 계산 상태를 그대로 유지할 수 있습니다. 목표 평단가 계산도 자동으로 이루어져 What-if 계산과 일관된 UX를 제공합니다. 또한 유닛 테스트를 통해 리팩토링의 안전성을 확보했습니다.

---

**이전 작업 (코인별 독립 데이터 관리):**

- 각 코인별 포트폴리오 분리 저장
- 코인 전환 시 자동 저장/불러오기
- 데이터 있음/없음 판단 및 처리

**이전 작업 (커스텀 코인 가격 저장):**

- 커스텀 코인 가격 저장 및 타임스탬프
- 인라인 가격 확인 iframe (CoinGecko)
- "마지막 업데이트: X분 전" 표시

**이전 작업 (다중 코인 지원):**

- 검색 가능한 코인 선택기 (Upbit API 통합)
- 사용자 임의 코인 추가 기능
- 자동/수동 가격 모드 전환
- 커스텀 코인 섹션 표시
- 가격 자동 갱신 버그 수정

**이전 작업 (UX 개선):**

- 실시간 자동 계산 (디바운싱 500ms)
- 평단가 변화율 표시 개선 (이모지 + 긍정 표현)
- 구조대 결과 표시 개선 (2줄 + 이모지)

**이전 작업 (백업/복원 기능):**

- 데이터 버전 관리 (v1) 및 다중 코인 구조 (Portfolios)
- 하위 호환성 지원 (자동 마이그레이션)
- 백업/복원 UI 및 기능 (Blob API, FileReader API)
- 하위 호환성 지원 (자동 마이그레이션)
- 백업/복원 UI 및 기능 (Blob API, FileReader API)
- 별도 브라우저 환경에서 모든 기능 정상 작동 확인

## 6. Phase 2: Stock Calculator (Completed)

**Objective**: successfully implemented a specialized "Water Down Calculator" for the Korean Stock Market (KOSPI/KOSDAQ) as a separate page (`stock.html`).

**Implementation Strategy (Executed)**:

1. **Hybrid UX**: Implemented a flow where users search stocks internally but verify prices via a direct link to Naver Finance, ensuring reliability without external API dependencies.
2. **Embedded Data**: Integrated `stock-data.js` with top Korean stocks for instant search and auto-complete functionality.
3. **Visual Distinction**: Applied `stock-theme` (Red/Blue colors relevant to Korean market: Red=Profit) and distinct UI elements.
4. **Isolated State**: Created a separate persistence layer (`stockCalcState`) to prevent data conflicts with the Coin Calculator.

**Key Deliverables**:

- **Stock Calculator Page (`stock.html`)**: Fully functional calculator tailored for stocks.
- **Stock Search Engine**: Instant keyboard-navigable search dropdown powered by local data.
- **Auto-Calculations**: Same robust logic as the coin calculator, but with manual price inputs.
- **Keyboard Optimization**: Both calculators now support arrow key navigation in the search dropdown for better UX.
- **Smart Logic**: `main.js` intelligently detects "Stock Mode" to disable crypto price fetching and switch storage keys.

## 7. Future Roadmap

- **Tax & Fee Calculation**: Add options to include standard transaction fees (0.05% ~ 0.23%) in the PnL calculation.
- **Expanded Stock List**: Import a more comprehensive list of KOSPI/KOSDAQ stocks.
- **PWA Features**: Add manifest and service worker for offline installation capability.

## 8. Latest Fixes (Search & UI Restoration)

- **Task**: 셧다운 후 기능 복구 및 UI/UX 개선
- **Changes Applied**:
  1. **코인 검색 기능 복구**: `coin-selector.js`와 HTML 간의 ID 불일치 문제 수정 및 안전한 DOM 요소 선택 로직 적용.
  2. **Worker 롤백**: 사용자 요청에 따라 `worker.js`의 변경 사항(User-Agent 헤더 추가)을 원상 복구.
  3. **UI 레이아웃 정상화**: `water_down_calculator.html` 내부의 잘못된 닫는 태그를 수정하여 레이아웃 깨짐 현상 해결.
  4. **입력 필드 확장**: 전체 컨테이너 너비를 540px로 확장하고, 가격 입력 필드의 고정 너비 제한을 제거하여 긴 숫자(소수점 8자리 등) 입력 가독성 개선.
  5. **반응형 로직 수정**: 내 지갑/거래소 기준 전환 시 계산 결과가 즉시 반영되도록 트리거 순서 수정.

## 9. Latest Fixes (Rollback Restoration & Persistence)

- **Task**: 롤백 후 발생한 스크립트 충돌 해결 및 데이터 저장 안정성 확보
- **Changes Applied**:
  1. **스크립트 실행 순서 문제 해결 (Race Condition Fix)**:
     - `main.js`의 초기화 완료 시점을 알리는 `CalculatorReady` 이벤트 시스템 도입.
     - `coin-selector.js`와 `stock-selector.js`가 이벤트를 기다린 후 실행되도록 수정하여 기능 먹통 현상 해결.
  2. **데이터 저장 안정성 강화 (Persistence Fix)**:
     - **초기화 가드(Guard) 도입**: 데이터가 완전히 로드되기 전에는 저장을 차단(`isDataLoaded`)하여, 새로고침 시 기존 데이터가 빈 값으로 덮어씌워지는 문제 원천 차단.
     - **새로고침/종료 시 강제 저장**: `beforeunload` 이벤트에 강제 저장 로직을 추가하여 입력 직후 종료해도 데이터 보존.
     - **코인/주식 복원 로직 개선**: 페이지 로드 시 마지막으로 보고 있던 코인/종목을 정확히 기억하고 복원.
  3. **숫자 포맷팅 개선**:
     - 코인 수량: `1,234.5678 1234` 형식 (정수 콤마, 소수점 4자리 공백 분리) 적용.
     - 입력 필드: 정수 부분 콤마 자동 적용, 소수점 입력 시 커서 위치 유지 개선.
  4. **UI 일관성 및 시인성 개선**:
     - 코인 선택기 UI를 주식 계산기와 동일한 카드 디자인(심볼 강조)으로 통일.
     - "결과 미리보기", "필요 금액 계산" 버튼에 보조(Secondary) 스타일 적용.
     - 다크모드에서 로또 생성 버튼 텍스트가 보이지 않는 문제 해결.
  5. **백업/복원/공유 기능 복구**:
     - `.json` 파일 내보내기/가져오기 기능 정상화.
     - 현재 상태를 URL로 공유하는 기능 복구.

## 10. Latest Fixes (UI Polish & Standardization)

- **Task**: UI 시인성 개선 및 푸터 표준화 (2026년 업데이트)
- **Changes Applied**:
  1. **UI 시인성 개선**:
     - 로또 번호 생성기 버튼: 다크모드에서도 잘 보이도록 텍스트 색상을 강제 지정(#333).
  2. **푸터 표준화 (Footer Standardization)**:
     - **연도 업데이트**: 저작권 연도를 2024년에서 **2026년**으로 일괄 변경.
     - **네비게이션 통일**: 모든 서브 페이지(코인/주식/로또) 하단에 '사용 설명서', '문의/버그 제보' 링크 추가.
  3. **문서(Documentation) 정비**:
     - `walkthrough.md`: 사용자 요청에 따라 이전 기능 복구 관련 시나리오를 제거하고, UI 개선 사항 검증에만 집중하도록 문서 재작성.

## 11. Latest Fixes (Functionality Restoration & UX)

- **Task**: 기능 복구 및 사용자 경험(UX) 개선
- **Changes Applied**:
  1. **입력 필드 순서 복구 (Input Revert)**:
     - 사용자의 익숙함을 고려하여 거래 내역의 [수량] - [가격] 순서를 원래대로 복구.
  2. **백업 파일명 구분 (Filename Distinction)**:
     - 주식용(`stock_calc_backup_`)과 코인용(`coin_calc_backup_`) 백업 파일명을 분리하여 데이터 혼동 방지.
  3. **커스텀 코인 추가 기능 복구**:
     - 코인이 하나도 없을 때 "새 코인 추가" 버튼이 숨겨지는 버그 수정 (검색 결과 없을 때 무조건 표시되도록 변경).
  4. **시세 확인 기능 개선**:
     - 불안정한 CoinGecko iframe 및 검색 링크 대신, **CoinGecko**와 **빗썸** 메인 페이지로 이동하는 정적 링크 버튼(🦎, 👍) 적용.

## 12. Phase 3: Analytics Integration (In Progress)

**Objective**: Integrate Google Analytics 4 (GA4) to track user engagement and site usage across all pages.

**Implementation Strategy (Planned)**:

1. **Global Tag Injection**: Inject the provided `googletagmanager` script into the `<head>` of all user-facing HTML files.
2. **Target Files**:
    - `index.html`
    - `water_down_calculator.html`
    - `stock.html`
    - `lottery.html`
    - `manual.html`
    - `contact.html`

## 13. 4단계: SEO 및 GEO 최적화 (진행 중)

**목표**: 검색 엔진(구글, 네이버) 및 AI 생성형 엔진(ChatGPT, Gemini, Clover X)에서의 노출을 극대화합니다.

**구현 전략**:

1. **메타 & OG 태그**: 표준 SEO 태그 및 소셜 공유를 위한 오픈 그래프 태그 적용.
2. **구조화 데이터 (JSON-LD)**: `WebApplication` 및 `FAQPage` 스키마를 구현하여 AI가 도구의 기능과 콘텐츠를 이해하도록 지원.
3. **크롤링 접근성**: `robots.txt` 및 `sitemap.xml` 추가.
4. **콘텐츠 최적화**: `manual.html`을 AI 친화적인 Q&A 형식으로 구조화.

## 14. 5단계: 사용자 유입 및 유지 (진행 예정)

**목표**: 방문자를 늘리고(Acquisition) 재방문을 유도(Retention)하는 장치를 마련합니다.

**구현 전략**:

1. **SNS 공유 (Viral)**: Web Share API를 활용하여 모바일 친화적인 공유 기능 구현.
2. **피드백 루프 (QA)**: 무료이면서 디자인이 우수한 피드백 위젯(Tally.so 등)을 연동하여 사용자의 목소리를 수집.
3. **앱 경험 제공 (PWA)**: 홈 화면 추가 유도를 통해 앱처럼 사용할 수 있도록 장려.

## 15. Latest Fixes (SEO & Cross-Promotion)

- **Task**: SEO 최적화 및 패밀리 사이트 링크 추가
- **Changes Applied**:
  1. **SEO Canonical 수정**:
      - `index.html`의 Canonical URL을 `/index.html`에서 `/`(루트)로 변경하여 Google Search Console의 "리디렉션이 포함된 페이지" 이슈 해결.
      - `sitemap.xml`에서도 `index.html` 경로를 루트로 통일.
  2. **교차 홍보 (Cross-Promotion)**:
      - 홈 화면 사이드바에 **"힐링 타일 (Healing Tiles)"** 게임 링크 추가.
      - 다국어 지원:
        - KO: "🧩 힐링 타일 (같은 그림 찾기)"
        - EN: "🧩 Healing Tiles (Mahjong Solitaire)"
