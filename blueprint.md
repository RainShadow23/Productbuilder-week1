# Blueprint for Web Projects in Firebase Studio

## Project Overview
This project involves refactoring an existing "Lotto Number Generator" into its own page and then developing a "Water Down Calculator" application. The calculator will initially demonstrate fetching real-time cryptocurrency prices from the Upbit API.

## Detailed Outline of Implemented Features

### Version 1.0 (Initial Lotto Number Generator)
- **Application Type**: Single-page web application.
- **Purpose**: Generates random lottery numbers and displays a history of generated numbers.
- **Technologies**: HTML, CSS, JavaScript.
- **UI Components**:
    - `index.html`: Contains the main structure, including a title, number display area, generate button, and history section.
    - `style.css`: Provides basic styling for the layout, numbers, buttons, and history list. Includes responsive design considerations.
    - `main.js`: Implements the lottery number generation logic, updates the DOM, manages history, and handles theme toggling.
- **Functionality**:
    - Generates 6 unique random numbers between 1 and 45.
    - Displays generated numbers in `span` elements.
    - Stores and displays a history of generated numbers.
    - Theme toggle button to switch between light/dark themes.
- **File Structure**:
    - `index.html`: Main HTML file.
    - `style.css`: Main stylesheet.
    - `main.js`: Main JavaScript logic.

## Plan for Current Change: Refactor Lotto, New Calculator Page, and Upbit API Integration

This plan outlines the steps to move the lottery generator to its own page, create a new page for the water down calculator, and implement the initial Bitcoin price fetching from the Upbit API.

### TODO List:
- [x] **Step 1: Create `lottery.html`**
    - Move all the content related to the Lotto Number Generator from `index.html` to a new file named `lottery.html`.
    - Ensure `lottery.html` includes its own `<head>` and `<body>` tags and links to `style.css` and `main.js`.
- [x] **Step 2: Create `water_down_calculator.html`**
    - Create a new HTML file named `water_down_calculator.html`.
    - This file will serve as the entry point for the water down calculator. Initially, it will be a basic HTML structure.
- [x] **Step 3: Update `index.html`**
    - Modify `index.html` to serve as a landing page or a navigation hub, linking to both `lottery.html` and `water_down_calculator.html`.
    - Remove all lottery-related content from `index.html`.
- [x] **Step 4: Implement Upbit API Integration in `main.js`**
    - In `main.js`, add JavaScript code to fetch the current Bitcoin price from the Upbit API.
    - Log the fetched price to the console to verify the API call.
    - Consider creating a separate JavaScript file (e.g., `waterDownCalculator.js`) for the calculator's specific logic if `main.js` becomes too crowded.
- [x] **Step 5: Verify Changes**
    - Ensure all links work correctly.
    - Check the browser console for the Bitcoin price output.
    - Confirm the Lotto Generator still functions on `lottery.html`.

## Plan for Current Change: Korean Translation and CORS Fix

This plan outlines the steps to translate the application to Korean and fix the CORS issue with the Upbit API.

### TODO List:
- [x] **Step 1: Translate HTML files to Korean**
    - `index.html`: Translated to Korean.
    - `lottery.html`: Translated to Korean.
    - `water_down_calculator.html`: Translated to Korean.
- [x] **Step 2: Implement CORS fix for Upbit API**
    - In `main.js`, prepend the Upbit API URL with a CORS proxy (`https://cors-anywhere.herokuapp.com/`).
- [x] **Step 3: Verify Changes**
    - Confirm the application is displayed in Korean.
    - Check if the Bitcoin price is now fetched and displayed correctly. (Failed)

## Plan for Current Change: Debug CORS Issue

This plan outlines the steps to debug the CORS issue with the Upbit API.

### TODO List:
- [x] **Step 1: Use a different CORS proxy**
    - In `main.js`, change the CORS proxy to `https://proxy.cors.sh/`.
- [x] **Step 2: Add enhanced error logging**
    - In `main.js`, add more detailed logging to the `fetchBitcoinPrice` function to inspect the response.
- [x] **Step 3: Verify Changes**
    - Confirm if the Bitcoin price is now fetched and displayed correctly. (Failed due to syntax error)

## Plan for Current Change: Fix JavaScript Syntax Error

This plan outlines the steps to fix a major syntax error in `main.js` that was preventing the script from running.

### TODO List:
- [x] **Step 1: Correct JavaScript Structure**
    - In `main.js`, wrap the entire script in a `DOMContentLoaded` event listener.
    - Scope page-specific variables inside their respective conditional blocks to prevent errors.
    - Remove a stray closing `});` that was causing the syntax error.
- [x] **Step 2: Verify Fix**
    - Confirm that both the lottery generator and the Bitcoin price fetching now work correctly on the live site. (Failed)

## Plan for Current Change: Diagnose & Implement Workaround for Live Site Issues

This plan outlines the steps to fix the lottery generator's initial state and implement a temporary workaround for the Bitcoin price fetching.

### TODO List:
- [x] **Step 1: Fix Lottery Initial State**
    - In `main.js`, add a call to `generateLottoNumbers()` on page load for the lottery page.
- [x] **Step 2: Implement Bitcoin Price Workaround**
    - Use the `web_fetch` tool to get the current Bitcoin price.
    - Hardcode the fetched price into `water_down_calculator.html`.
    - Remove the client-side fetching logic from `main.js`.
- [x] **Step 3: Verify Workarounds**
    - Confirm the lottery page now loads with numbers. (Failed)
    - Confirm the calculator page displays the hardcoded price. (Success)

## Plan for Current Change: Implement UI-based Debugging

This plan outlines the steps to make the JavaScript more resilient and add a UI-based logging system to debug issues on the live site.

### TODO List:
- [x] **Step 1: Add Debug Element**
    - Add a `div` with `id="debug-log"` to `lottery.html` to display log messages.
- [x] **Step 2: Refactor JavaScript Logic**
    - In `main.js`, remove URL-based page detection.
    - Use the existence of the `generate-btn` element to trigger lottery-specific code.
    - Implement a `log` function to write messages to both the console and the new debug `div`.
- [in_progress] **Step 3: Verify Debugging System**
    - Confirm that log messages appear in the top-left corner of the live site's lottery page.
