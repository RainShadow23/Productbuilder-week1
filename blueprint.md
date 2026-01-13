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

- **Task**: 커스텀 코인 가격 저장 + 타임스탬프 및 인라인 가격 확인 기능 추가
- **Changes Applied**:
  1. **가격 저장 및 타임스탬프**:
     - 커스텀 코인 가격 입력 시 localStorage에 자동 저장
     - "마지막 업데이트: X분 전" 표시 (방금 전 → X분 전 → X시간 전 → X일 전)
     - 1분마다 자동 업데이트
     - 코인 재선택 시 저장된 가격 자동 로드
  2. **인라인 가격 확인 iframe**:
     - 커스텀 코인 선택 시에만 표시
     - "가격 확인하기 ▼" 접기/펼치기 버튼
     - CoinGecko 검색 페이지 임베드
     - 같은 화면에서 가격 확인 가능
  3. **UI/UX 개선**:
     - 가격 입력란 아래 타임스탬프 표시
     - 접을 수 있는 가격 확인 섹션
     - Upbit 코인 선택 시 자동으로 숨김

- **Developer Context**: 사용자가 커스텀 코인의 가격을 언제 입력했는지 알 수 있도록 타임스탬프를 추가하고, 외부 사이트에서 가격을 쉽게 확인할 수 있도록 인라인 iframe을 제공합니다.

---

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
