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

- **Task**: What-if 계산기 UX 개선 및 구조대 표시 개선
- **Changes Applied**:
  1. **실시간 자동 계산**: What-if 계산에 디바운싱(500ms) 적용하여 입력 후 자동으로 결과 표시
  2. **평단가 변화율 표시 개선**:
     - 기존: `(-0.56%)` 파란색 → 손실처럼 느껴짐
     - 개선: `✅ 0.56% 개선` 초록색 / `⚠️ 0.56% 상승` 주황색
     - 이모지와 긍정적 표현으로 의미 전달 명확화
  3. **구조대 결과 표시 개선**:
     - 기존: 1줄 평범한 텍스트
     - 개선: 2줄 + 이모지 (`🎯 목표 달성` / `📊 BTC 추가 매수 필요`)
  4. **CSS 추가**: `.improvement`, `.warning`, `.neutral` 클래스

- **Developer Context**: 사용자 피드백을 반영하여 UX를 개선했습니다. 마이너스 기호와 파란색이 "손실"로 오해되는 문제를 해결하고, 이모지로 시각적 임팩트를 강화했습니다.

---

**이전 작업 (백업/복원 기능):**

- 데이터 버전 관리 (v1) 및 다중 코인 구조 (Portfolios)
- 하위 호환성 지원 (자동 마이그레이션)
- 백업/복원 UI 및 기능 (Blob API, FileReader API)
- 별도 브라우저 환경에서 모든 기능 정상 작동 확인
