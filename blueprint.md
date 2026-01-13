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

- **Task**: 코인별 독립 데이터 관리 구현
- **Changes Applied**:
  1. **코인별 포트폴리오 분리**:
     - 각 코인(BTC, ETH, 커스텀 코인 등)이 독립적인 데이터 저장
     - localStorage 구조: `portfolios: { "BTC": {...}, "ETH": {...} }`
     - 코인 전환 시 자동 저장/불러오기
  2. **데이터 상태 관리**:
     - 데이터 있는 경우: 저장된 값 자동 복원 (수량, 평단가, 거래내역, 계산모드)
     - 데이터 없는 경우: 빈 상태로 초기화
     - 콘솔 로그로 저장/불러오기 확인 가능
  3. **전역 함수 노출**:
     - `window.saveState()`: 현재 코인 데이터 저장
     - `window.loadCoinData(coinSymbol)`: 특정 코인 데이터 불러오기
  4. **UI/UX 개선**:
     - What-if 및 목표 평단가 결과 초기화
     - 코인 전환 시 결과 화면 자동 숨김

- **Developer Context**: 사용자가 여러 코인을 관리할 때 각 코인의 데이터가 섞이지 않도록 독립적인 포트폴리오를 제공합니다. BTC에서 ETH로 전환하면 BTC 데이터는 자동 저장되고 ETH 데이터가 로드되며, 다시 BTC로 돌아가면 이전 데이터가 복원됩니다.

---

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
- 별도 브라우저 환경에서 모든 기능 정상 작동 확인
