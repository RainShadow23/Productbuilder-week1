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
- [x] **Step 3: Verify Debugging System**
    - Confirm that log messages appear in the top-left corner of the live site's lottery page. (Success, but revealed underlying issue)

## Plan for Current Change: Final Fix: Resolve Environment Race Condition

This plan outlines the steps to resolve a race condition between the script execution and DOM rendering in the Firebase Studio preview environment.

### TODO List:
- [x] **Step 1: Use `window.load` Event**
    - In `main.js`, change the main event listener from `DOMContentLoaded` to `window.addEventListener('load', ...)`. This ensures all page resources are loaded before the script runs, making it more robust.
- [x] **Step 2: Final Verification**
    - Confirm that the lottery generator and all other features work correctly in **both** the Firebase Studio preview and the live production site. (Success)

## Plan for Current Change: Implement Cloudflare Worker for Dynamic Price Fetching

This plan outlines the implementation of a Cloudflare Worker as a proxy for the Upbit API to fetch real-time cryptocurrency prices dynamically.

### TODO List:
- [x] **Step 1: Create Cloudflare Worker Script**
    - Create a `worker.js` file with the generic proxy code for the Upbit API.
- [x] **Step 2: User Deploys Worker**
    - Provide instructions for the user to deploy the `worker.js` script to Cloudflare Workers and provide the deployed Worker URL.
- [x] **Step 3: Update `main.js` for Worker Integration**
    - Re-introduce the `fetchBitcoinPrice` function in `main.js`.
    - Modify the `fetchBitcoinPrice` function to use the deployed Cloudflare Worker URL.
    - Implement a `try...catch` block with graceful error handling for the preview environment.
- [x] **Step 4: Update `water_down_calculator.html`**
    - Change the hardcoded Bitcoin price back to "로딩중..." to allow dynamic fetching.
- [x] **Step 5: Verify Dynamic Price Fetching**
    - Confirm that the Bitcoin price is dynamically fetched and displayed correctly on the live site. (Failed)
    - Confirm that an appropriate message is displayed in the Firebase Studio preview. (Worked, but showed real data unexpectedly)

## Plan for Current Change: Final Debugging of Live Site

This plan outlines adding a detailed, UI-based error logging system to the calculator page to diagnose the final issue on the live production site.

### TODO List:
- [x] **Step 1: Add Debug Element to Calculator**
    - Add a `div` with `id="debug-log-calc"` to `water_down_calculator.html`.
- [x] **Step 2: Add Granular Logging to `fetchBitcoinPrice`**
    - In `main.js`, create a new `logCalc` function.
    - Add detailed logging to every step of the `fetch` process, especially the `catch` block, to make the error visible on the UI.
    - Make page-specific logic more robust by checking for element existence (`if (document.getElementById('bitcoin-price'))`) instead of URL paths.
- [x] **Step 3: Final Live Site Verification**
    - Instruct the user to check the live site and report the exact contents of the new debug log. (Success, revealed 429 error)

## Plan for Current Change: Implement Auto-Refreshing Price with UI Timer

This plan outlines the final implementation for the Bitcoin price feature, incorporating user feedback to add an auto-refreshing timer that is visible to the user.

### TODO List:
- [x] **Step 1: Add Timer UI Element**
    - In `water_down_calculator.html`, add a `span` with `id="update-timer"` to display the countdown.
    - Remove the temporary debug `div`.
- [x] **Step 2: Implement Timer Logic in `main.js`**
    - Create a 5-second countdown timer using `setInterval`.
    - When the timer reaches zero, trigger the `fetchBitcoinPrice` function.
    - The timer resets after every fetch attempt (success or fail).
    - The UI is updated every second to show the countdown to the user.
- [x] **Step 3: Final Project Verification**
    - Confirm that the price auto-refreshes every 5 seconds on the live site.
    - Confirm the countdown timer is displayed and works correctly. (Success)

## Plan for Current Change: Implement Full Calculator UI and Logic

This plan outlines the implementation of the full user interface and calculation logic for the water down calculator, based on user feedback.

### TODO List:
- [x] **Step 1: Build Calculator HTML Structure**
    - In `water_down_calculator.html`, build the full UI including:
        - A toggle switch for "Exchange" vs. "Wallet" modes.
        - Inputs for initial holdings.
        - A dynamic list for adding/removing multiple buy/sell transactions.
        - An editable input for the current price.
        - A results section.
- [x] **Step 2: Style New UI Elements**
    - In `style.css`, add styling for the new toggle switch, input groups, dynamic rows, and results section to ensure a clean layout.
- [x] **Step 3: Implement Calculator JavaScript Logic**
    - In `main.js`, add all client-side logic for the calculator:
        - Event handling for the mode toggle.
        - A function to dynamically add and remove transaction rows.
        - A core `calculate` function that runs when the "Calculate" button is clicked.
        - The `calculate` function contains separate logic for both "Exchange" and "Wallet" modes.
        - Logic to read all inputs, perform the calculations, and display the results.
- [x] **Step 4: Final Feature Verification**
    - Confirm all calculator features work as expected on the live site. (Failed: Bug found in 'Exchange' mode logic)

## Plan for Current Change: Fix Calculator Logic Bug

This plan outlines fixing a bug in the "Exchange Standard" calculation mode.

### TODO List:
- [x] **Step 1: Correct 'Exchange' Mode Logic**
    - In `main.js`, update the calculation to correctly subtract sold quantities from the total holdings while maintaining the average price based only on buys.
- [x] **Step 2: Final Bugfix Verification**
    - Confirm the "Exchange Standard" mode now calculates correctly. (Success)

## Plan for Current Change: Implement Data Persistence (LocalStorage & URL State)

This plan outlines the implementation of data persistence using both localStorage for automatic saving and URL query strings for sharing and permanent saving.

### TODO List:
- [x] **Step 1: Implement `localStorage` Saving/Loading**
    - Add `saveStateToLocalStorage` and `loadStateFromLocalStorage` functions.
    - Implement auto-saving to `localStorage` on input changes.
    - Load state from `localStorage` on page load.
- [x] **Step 2: Implement URL State Saving/Loading**
    - Add a `[상태 저장/공유 링크 복사]` button.
    - Implement logic to serialize/encode the current state into a URL query parameter (`?data=...`).
    - Implement logic to load state from the URL query parameter on page load (prioritizing URL over `localStorage`).
- [x] **Step 3: Final Persistence Verification**
    - Confirm that `localStorage` auto-saves and loads correctly.
    - Confirm that the URL state can be copied, shared, and loaded correctly.

## Plan for Current Change: Final Bug Fixes and Feature Enhancements

This plan outlines the final fixes and feature enhancements based on user feedback.

### TODO List:
- [x] **Step 1: Fix 'Add Transaction' Button**
    - Restore the missing event listener for the 'Add Transaction' button in `main.js`.
- [x] **Step 2: Add 'Calculation Price' Input**
    - Add a new editable input field for `calculation-price` to `water_down_calculator.html` for use in "What-if" and "Target" calculations.
- [x] **Step 3: Update Calculation Logic**
    - Update the "What-if" and "Target" calculation functions in `main.js` to use the new `calculation-price` input.
- [x] **Step 4: Implement All Final Logic**
    - Write the complete, final `main.js` including all features: calculation modes, dynamic rows, persistence, and goal-oriented calculations.
- [in_progress] **Step 5: Final Project Verification**
    - Confirm all features work as expected on the live site.
