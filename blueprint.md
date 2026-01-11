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

**Key Features:**

- **Real-time Price Fetching**:
    - Fetches the current KRW-BTC price from the Upbit API via a Cloudflare Worker proxy.
    - The price automatically refreshes every 30 seconds, with robust error handling.

- **Calculation Modes**:
    - **거래소 기준 (Exchange Mode)**: Calculates the average buy price based only on buy transactions. The final quantity is the total bought minus the total sold. This simulates how exchanges often calculate average cost.
    - **내 지갑 기준 (Wallet Mode)**: Calculates profit/loss on each sale based on the average price at the time of the sale, providing a more detailed "wallet-aware" calculation.

- **Core Calculation Results**:
    - Displays final holdings, total investment, final average price, total evaluation value, profit and loss (PnL), and return on investment (ROI).

- **"What-if" Calculation (`추가 매수 시 평단가 계산`)**:
    - Allows the user to input an additional purchase amount (in KRW) to see the resulting average price without affecting their main calculation.

- **Target Average Price Calculation (`목표 평단가로 필요 금액 계산`)**:
    - Calculates the amount of cryptocurrency (and the required KRW investment) needed to reach a specific target average price.
    - **Formula**: `requiredQty = (totalBuyQty * (currentAvgBuyPrice - targetPrice)) / (targetPrice - calcPrice)`
    - **Crucial Validation Logic**: The calculation is only possible if the logical condition `calcPrice < targetPrice < currentAvgBuyPrice` can be met. The UI enforces this with clear error messages:
        1.  **Must have holdings**: The calculation cannot run if `currentAvgBuyPrice` is zero.
        2.  **Cannot "average down" if in profit**: If the user's `currentAvgBuyPrice` is already less than or equal to the `calcPrice` (the price of a new purchase), it's mathematically impossible to lower the average. The UI explicitly states this, showing the current and calculation prices for clarity.
        3.  **Target must be logical**: The `targetPrice` must be lower than the `currentAvgBuyPrice` and higher than the `calcPrice`. The UI guides the user with specific messages if they fail to meet these conditions.

- **Data Persistence**:
    - **LocalStorage**: The entire state of the calculator (inputs, transactions) is automatically saved to `localStorage` on any change.
    - **URL Sharing**: A "Share Link" button encodes the entire state into a Base64 string in the URL (`?data=...`), allowing users to save, bookmark, and share their exact calculations. The app prioritizes loading from the URL over `localStorage`.

### 4.2. Lotto Number Generator (`lottery.html`)

A simple tool for generating and tracking lottery numbers.

- **Features**:
    - Generates 6 unique random numbers between 1 and 45.
    - Maintains a history of all generated number sets for the session.

### 4.3. General Style & Structure

- **Theme**: A dark/light mode theme toggle is available and its state is persisted in `localStorage`.
- **Code Structure**: Page-specific logic is scoped and initialized using a `window.addEventListener('load', ...)` event to ensure all DOM elements are available, preventing race conditions in the development environment.

## 5. Most Recent Change (Summary)

Replaced multiple "Plan for change" sections with this consolidated summary.

- **Task**: Fix a persistent logic bug in the "Target Average Price Calculation" feature of the Water Down Calculator.
- **Problem**: Users reported that the calculation was always failing with confusing error messages, even when they had existing holdings.
- **Resolution**:
    - The core issue was identified: users were trying to "average down" (물타기) while their portfolio was already in a profitable state (i.e., their `currentAvgBuyPrice` was lower than the `calcPrice`). In this scenario, it is mathematically impossible to lower the average price by buying more.
    - The JavaScript logic was updated to explicitly check for this condition (`currentAvgBuyPrice <= calcPrice`).
    - If this condition is met, the UI now displays a clear, dynamic error message explaining why the calculation is impossible, e.g., "현재 평단가(50,000원)가 계산 기준 가격(52,000원)보다 낮거나 같아 평단가를 더 낮출 수 없습니다." (Cannot lower the average price because the current average price (50,000 KRW) is lower than or equal to the calculation price (52,000 KRW)).
    - This fix resolves the user's confusion and provides actionable feedback.