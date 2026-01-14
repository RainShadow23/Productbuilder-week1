
import {
    calculateExchangeMode,
    calculateWalletMode,
    calculateWhatIf,
    calculateTargetRequiredQty,
    safeParseFloat
} from './calculation-logic.js';

// ============================================================
// 전역 설정 및 상수
// ============================================================

const APP_CONFIG = {
    PRICE_UPDATE_INTERVAL: 30000,
    DEBOUNCE_DELAY: 500,
    WORKER_CACHE_SECONDS: 20
};

// ============================================================
// DOM 요소 참조 (안전하게 가져오기)
// ============================================================

const getEl = (id) => document.getElementById(id);

// Common
const themeToggleBtn = getEl('theme-toggle');

// Calculator Inputs
const currentPriceInput = getEl('current-price');
const calculationPriceInput = getEl('calculation-price');
const calcModeCheckbox = getEl('calc-mode-checkbox');
const initialQtyInput = getEl('initial-qty');
const initialAvgPriceInput = getEl('initial-avg-price');
const transactionList = getEl('transaction-list');
const addTransactionBtn = getEl('add-transaction-btn');
const calculateBtn = getEl('calculate-btn');
const shareBtn = getEl('share-btn');
const resetBtn = getEl('reset-btn');
const backupBtn = getEl('backup-btn');
const restoreBtn = getEl('restore-btn');
const fileInput = getEl('file-input');
const resultsContainer = getEl('results-container');
const transactionRowTemplate = getEl('transaction-row-template');

// What-if
const whatifAmountInput = getEl('whatif-amount');
const whatifCalculateBtn = getEl('whatif-calculate-btn');
const whatifResultDisplay = getEl('whatif-result');
const visualContainer = getEl('whatif-visual-container');
const visualCurrentPrice = getEl('visual-current-price');
const visualNewPrice = getEl('visual-new-price');
const barCurrent = getEl('bar-current');
const barNew = getEl('bar-new');

// Target Price
const targetAvgPriceInput = getEl('target-avg-price');
const targetCalculateBtn = getEl('target-calculate-btn');
const targetResultDisplay = getEl('target-result');

// Results
const resultSpans = {
    totalQty: getEl('result-total-qty'),
    totalInvestment: getEl('result-total-investment'),
    finalAvgPrice: getEl('result-final-avg-price'),
    totalEvaluation: getEl('result-total-evaluation'),
    pnl: getEl('result-pnl'),
    returnRate: getEl('result-return-rate'),
};

// State
let calculationMode = 'exchange';
let priceUpdateInterval;
const isStockMode = document.body.classList.contains('stock-theme');
const STORAGE_KEY = isStockMode ? 'stockCalcState' : 'waterDownCalcState';

// Global State
window.currentCoin = isStockMode ? '005930' : 'BTC';
let allCoins = [];
let customCoins = JSON.parse(localStorage.getItem('customCoins')) || [];
const CURRENT_DATA_VERSION = 1;
let isDataLoaded = false; // Guard against saving partial initialization state


// ============================================================
// 초기화 및 이벤트 리스너 등록
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle
    if (themeToggleBtn) {
        if (localStorage.getItem('theme') === 'light') document.body.classList.add('light');
        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('light');
            localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
        });
    }

    // Input Formatting
    document.body.addEventListener('input', (e) => {
        if (e.target.classList.contains('comma-input')) handleCommaInput(e);
    });

    // Main Calculator Listeners
    if (addTransactionBtn) addTransactionBtn.addEventListener('click', () => addTransactionRow());
    if (calculateBtn) calculateBtn.addEventListener('click', calculate);
    if (shareBtn) shareBtn.addEventListener('click', handleShare);
    if (resetBtn) resetBtn.addEventListener('click', handleReset);
    if (backupBtn) backupBtn.addEventListener('click', exportData);
    if (restoreBtn && fileInput) {
        restoreBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) importData(e.target.files[0]);
        });
    }

    // Auto-Save Listeners
    const inputsToWatch = [initialQtyInput, initialAvgPriceInput, currentPriceInput, calculationPriceInput];
    inputsToWatch.forEach(el => {
        if (el) el.addEventListener('input', debouncedSaveState);
    });
    if (transactionList) transactionList.addEventListener('input', debouncedSaveState);

    if (calcModeCheckbox) {
        calcModeCheckbox.addEventListener('change', () => { updateMode(); saveState(); });

        // Add click listeners to segment options for UI interaction
        const segments = document.querySelectorAll('.segment-option');
        segments.forEach(seg => {
            seg.addEventListener('click', () => {
                const isWallet = seg.dataset.value === 'wallet';
                calcModeCheckbox.checked = isWallet;
                // Dispatch change event to trigger the listener above
                calcModeCheckbox.dispatchEvent(new Event('change'));
                calculate(); // Calculate immediately when mode changes
            });
        });

        updateMode(); // Init mode
    }

    // What-if Listeners
    if (whatifCalculateBtn && whatifAmountInput) {
        whatifCalculateBtn.addEventListener('click', calculateWhatif);
        whatifAmountInput.addEventListener('input', debounce(calculateWhatif, APP_CONFIG.DEBOUNCE_DELAY));
    }

    // Target Price Listeners
    if (targetCalculateBtn && targetAvgPriceInput) {
        targetCalculateBtn.addEventListener('click', calculateTargetPrice);
        targetAvgPriceInput.addEventListener('input', debounce(calculateTargetPrice, APP_CONFIG.DEBOUNCE_DELAY));
    }

    // Auto-fill Current Price to Calculation Price
    if (calculationPriceInput && currentPriceInput) {
        calculationPriceInput.addEventListener('input', () => {
            if (calculationPriceInput.value === '') {
                const price = safeParseFloat(currentPriceInput.value);
                if (price > 0) calculationPriceInput.value = formatNumberWithCommas(price);
            }
        });
    }

    // Initialize Data
    initialize();

    // Signal that Calculator is ready for Selectors
    window.dispatchEvent(new Event('CalculatorReady'));
    window.isCalculatorReady = true;
});

// ============================================================
// Core Functions
// ============================================================

function initialize() {
    const urlParams = new URLSearchParams(window.location.search);
    const encodedData = urlParams.get('data');
    let stateToLoad = null;

    if (encodedData) {
        try {
            stateToLoad = JSON.parse(decodeURIComponent(atob(encodedData)));
        } catch (e) {
            console.error('URL Data Load Error:', e);
        }
    }

    if (!stateToLoad) {
        stateToLoad = JSON.parse(localStorage.getItem(STORAGE_KEY));
    }

    // Restore last active coin if available
    if (stateToLoad && stateToLoad.activeCoin) {
        window.currentCoin = stateToLoad.activeCoin;
    }

    loadState(stateToLoad);
    fetchCurrentCoinPrice();
    priceUpdateInterval = setInterval(fetchCurrentCoinPrice, APP_CONFIG.PRICE_UPDATE_INTERVAL);
}

window.loadCoinData = function (coinSymbol) {
    if (!coinSymbol) return;

    // Check if we were already loaded (switching coins)
    // If so, we might want to ensure the PREVIOUS coin was saved? 
    // (Handled by selector usually, but good to note)

    // Set guard to false while loading new data
    isDataLoaded = false;

    window.currentCoin = coinSymbol;

    // Update badge if needed (coin mode)
    if (!isStockMode && window.coinSelector) {
        /* Badge update logic if needed */
    }

    const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const state = loadState(savedData); // This returns the full state object, doesn't update UI directly for specific coin unless logic handles it

    // Specifically load the portfolio for this coin
    const portfolio = state?.portfolios?.[coinSymbol];

    if (transactionList) transactionList.innerHTML = '';

    if (portfolio) {
        if (calcModeCheckbox) calcModeCheckbox.checked = portfolio.calcMode || false;
        updateMode();

        if (initialQtyInput) initialQtyInput.value = portfolio.initialQty || '';
        if (initialAvgPriceInput) initialAvgPriceInput.value = portfolio.initialAvgPrice || '';
        if (calculationPriceInput && portfolio.calculationPrice) calculationPriceInput.value = portfolio.calculationPrice;
        if (whatifAmountInput && portfolio.whatifAmount) whatifAmountInput.value = portfolio.whatifAmount;
        if (initialAvgPriceInput) initialAvgPriceInput.value = portfolio.initialAvgPrice || '';
        if (currentPriceInput && portfolio.currentPrice) currentPriceInput.value = portfolio.currentPrice; // Restore Current Price
        if (calculationPriceInput && portfolio.calculationPrice) calculationPriceInput.value = portfolio.calculationPrice;
        if (whatifAmountInput && portfolio.whatifAmount) whatifAmountInput.value = portfolio.whatifAmount;
        if (targetAvgPriceInput && portfolio.targetAvgPrice) targetAvgPriceInput.value = portfolio.targetAvgPrice;

        if (portfolio.transactions && portfolio.transactions.length > 0) {
            portfolio.transactions.forEach(tx => addTransactionRow(tx));
        } else {
            addTransactionRow();
        }
    } else {
        // Default / New Coin
        if (calcModeCheckbox) calcModeCheckbox.checked = false;
        updateMode();
        if (initialQtyInput) initialQtyInput.value = '';
        if (initialAvgPriceInput) initialAvgPriceInput.value = '';
        if (transactionList) transactionList.innerHTML = '';
        addTransactionRow();
        if (resultsContainer) resultsContainer.style.display = 'none';

        // Auto-fill calc price if empty
        if (!isStockMode && calculationPriceInput && !calculationPriceInput.value && currentPriceInput) {
            const price = safeParseFloat(currentPriceInput.value);
            if (price > 0) calculationPriceInput.value = formatNumberWithCommas(price);
        }
    }

    // Reset Results
    if (whatifResultDisplay) whatifResultDisplay.textContent = '';
    if (targetResultDisplay) targetResultDisplay.textContent = '';
    if (visualContainer) visualContainer.style.display = 'none';

    fetchCurrentCoinPrice();
    if (priceUpdateInterval) clearInterval(priceUpdateInterval);
    priceUpdateInterval = setInterval(fetchCurrentCoinPrice, APP_CONFIG.PRICE_UPDATE_INTERVAL);

    // Data is fully loaded into inputs, it is now safe to save
    isDataLoaded = true;
};

window.saveState = saveState;

function saveState() {
    // Critical Safety: Do not save if data hasn't been fully loaded yet.
    // This prevents overwriting persistent storage with empty initialization values.
    if (!isDataLoaded) return;

    let fullState = JSON.parse(localStorage.getItem(STORAGE_KEY)) || { version: CURRENT_DATA_VERSION, portfolios: {} };
    fullState.version = CURRENT_DATA_VERSION;
    fullState.lastUpdated = new Date().toISOString();
    fullState.activeCoin = window.currentCoin;

    fullState.portfolios[window.currentCoin] = {
        calcMode: calcModeCheckbox ? calcModeCheckbox.checked : false,
        initialQty: initialQtyInput ? initialQtyInput.value : '',
        initialAvgPrice: initialAvgPriceInput ? initialAvgPriceInput.value : '',
        transactions: [],
        calculationPrice: calculationPriceInput ? calculationPriceInput.value : '',
        whatifAmount: whatifAmountInput ? whatifAmountInput.value : '',
        initialAvgPrice: initialAvgPriceInput ? initialAvgPriceInput.value : '',
        currentPrice: currentPriceInput ? currentPriceInput.value : '', // Save Current Price
        transactions: [],
        calculationPrice: calculationPriceInput ? calculationPriceInput.value : '',
        whatifAmount: whatifAmountInput ? whatifAmountInput.value : '',
        targetAvgPrice: targetAvgPriceInput ? targetAvgPriceInput.value : ''
    };

    if (transactionList) {
        fullState.portfolios[window.currentCoin].transactions = Array.from(transactionList.querySelectorAll('.transaction-row')).map(row => ({
            type: row.querySelector('.transaction-type').value,
            qty: row.querySelector('.transaction-qty').value,
            price: row.querySelector('.transaction-price').value,
        }));
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(fullState));
}

function loadState(savedData) {
    if (!savedData) return { version: CURRENT_DATA_VERSION, portfolios: {} };
    // Migration logic could go here if needed
    return savedData;
}

function addTransactionRow(tx = null) {
    if (!transactionList || !transactionRowTemplate) return;
    const newRow = transactionRowTemplate.content.cloneNode(true);
    if (tx) {
        newRow.querySelector('.transaction-type').value = tx.type;
        newRow.querySelector('.transaction-qty').value = tx.qty;
        newRow.querySelector('.transaction-price').value = tx.price;
    }
    const removeBtn = newRow.querySelector('.remove-transaction-btn');
    transactionList.appendChild(newRow);
    if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
            e.target.closest('.transaction-row').remove();
            saveState();
        });
    }
}

function updateMode() {
    if (calcModeCheckbox && calcModeCheckbox.checked) {
        calculationMode = 'wallet';
    } else {
        calculationMode = 'exchange';
    }
    const segments = document.querySelectorAll('.segment-option');
    segments.forEach(seg => {
        if (seg.dataset.value === calculationMode) seg.classList.add('active');
        else seg.classList.remove('active');
    });
}

function calculate() {
    if (!initialQtyInput || !initialAvgPriceInput) return;
    let initialQty = safeParseFloat(initialQtyInput.value);
    let initialCost = initialQty * safeParseFloat(initialAvgPriceInput.value);

    const transactions = Array.from(document.querySelectorAll('.transaction-row')).map(row => ({
        type: row.querySelector('.transaction-type').value,
        qty: safeParseFloat(row.querySelector('.transaction-qty').value),
        price: safeParseFloat(row.querySelector('.transaction-price').value),
    }));

    let result;
    if (calculationMode === 'exchange') {
        result = calculateExchangeMode(initialQty, safeParseFloat(initialAvgPriceInput.value), transactions);
    } else {
        result = calculateWalletMode(initialQty, safeParseFloat(initialAvgPriceInput.value), transactions);
    }

    const { finalQty, finalCost, finalAvgPrice } = result;
    const currentPrice = currentPriceInput ? safeParseFloat(currentPriceInput.value) : 0;
    const totalEvaluation = finalQty * currentPrice;
    const pnl = totalEvaluation - finalCost;
    const returnRate = (finalCost > 0) ? (pnl / finalCost) * 100 : 0;

    if (resultSpans.totalQty) resultSpans.totalQty.innerHTML = formatQuantityForDisplay(finalQty);
    if (resultSpans.totalInvestment) resultSpans.totalInvestment.innerHTML = `${formatCurrencyForDisplay(finalCost)} KRW`;
    if (resultSpans.finalAvgPrice) resultSpans.finalAvgPrice.innerHTML = `${formatCurrencyForDisplay(finalAvgPrice)} KRW`;
    if (resultSpans.totalEvaluation) resultSpans.totalEvaluation.innerHTML = `${formatCurrencyForDisplay(totalEvaluation)} KRW`;
    if (resultSpans.pnl) resultSpans.pnl.innerHTML = `${formatCurrencyForDisplay(pnl)} KRW`;
    if (resultSpans.returnRate) resultSpans.returnRate.textContent = returnRate.toFixed(2) + ' %';

    if (resultsContainer) resultsContainer.style.display = 'block';
    saveState();
}

async function fetchCurrentCoinPrice() {
    if (isStockMode) return;
    if (!window.currentCoin) return;

    // Skip if custom
    if (window.coinSelector && window.coinSelector.getCurrentCoin()?.isCustom) return;

    try {
        const market = `KRW-${window.currentCoin}`;
        const response = await fetch(`https://upbit-proxy.ooktone.workers.dev/v1/ticker?markets=${market}`);
        if (!response.ok) throw new Error('API Error');
        const data = await response.json();
        if (data && data.length > 0) {
            const price = data[0].trade_price;
            if (currentPriceInput) currentPriceInput.value = price.toLocaleString();
            if (calculationPriceInput && !calculationPriceInput.value) {
                calculationPriceInput.value = formatNumberWithCommas(price);
            }
        }
    } catch (e) {
        if (currentPriceInput) currentPriceInput.placeholder = '가격 로드 실패';
    }
}

// Check Logic Buttons (What-if / Target)
function calculateWhatif() {
    if (!whatifAmountInput || !calculationPriceInput || !whatifResultDisplay) return;

    const amount = safeParseFloat(whatifAmountInput.value);
    const calcPrice = safeParseFloat(calculationPriceInput.value);
    const { totalBuyQty, totalBuyCost } = getPreCalculationState();

    const currentAvg = totalBuyQty > 0 ? totalBuyCost / totalBuyQty : 0;
    if (currentAvg === 0) {
        whatifResultDisplay.textContent = '보유 정보를 입력해주세요.';
        return;
    }

    const result = calculateWhatIf(totalBuyQty, totalBuyCost, amount, calcPrice);
    if (!result) {
        whatifResultDisplay.textContent = '입력값을 확인해주세요.';
        return;
    }

    const { newAvgPrice, changePercent, direction } = result;
    const changeText = direction === 'improvement' ? `✅ ${changePercent.toFixed(2)}% 개선` :
        direction === 'warning' ? `⚠️ ${changePercent.toFixed(2)}% 상승` : '변화 없음';

    whatifResultDisplay.innerHTML = `예상 평단가: <span class="result-value">${formatCurrencyForDisplay(newAvgPrice)} KRW</span> ${changeText}`;

    if (visualContainer && barCurrent && barNew) {
        visualContainer.style.display = 'block';
        if (visualCurrentPrice) visualCurrentPrice.innerHTML = formatCurrencyForDisplay(currentAvg);
        if (visualNewPrice) visualNewPrice.innerHTML = formatCurrencyForDisplay(newAvgPrice);

        // Simple visual bar logic
        barCurrent.style.width = '50%';
        barNew.style.width = newAvgPrice < currentAvg ? '40%' : '60%'; // Simple indication for now
        barNew.className = 'visual-bar bar-new ' + direction;
    }
}

function calculateTargetPrice() {
    if (!targetAvgPriceInput || !calculationPriceInput || !targetResultDisplay) return;
    const targetPrice = safeParseFloat(targetAvgPriceInput.value);
    const calcPrice = safeParseFloat(calculationPriceInput.value);
    const { totalBuyQty, totalBuyCost } = getPreCalculationState();

    const result = calculateTargetRequiredQty(totalBuyQty, totalBuyCost, targetPrice, calcPrice);
    if (result.error) {
        targetResultDisplay.textContent = result.error;
    } else {
        const { requiredQty, requiredAmount } = result;
        targetResultDisplay.innerHTML = `💰 필요 투자금: ${formatCurrencyForDisplay(requiredAmount)} KRW<br>📊 ${formatQuantityForDisplay(requiredQty)} 추가 매수`;
    }
}

function getPreCalculationState() {
    let totalBuyQty = initialQtyInput ? safeParseFloat(initialQtyInput.value) : 0;
    let totalBuyCost = totalBuyQty * (initialAvgPriceInput ? safeParseFloat(initialAvgPriceInput.value) : 0);

    if (transactionList) {
        transactionList.querySelectorAll('.transaction-row').forEach(row => {
            const type = row.querySelector('.transaction-type').value;
            const qty = safeParseFloat(row.querySelector('.transaction-qty').value);
            const price = safeParseFloat(row.querySelector('.transaction-price').value);
            if (type === 'buy') {
                totalBuyQty += qty;
                totalBuyCost += qty * price;
            }
        });
    }
    return { totalBuyQty, totalBuyCost };
}

// Utils
const formatNumberWithCommas = (num) => String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const formatCurrencyForDisplay = (num) => formatNumberWithCommas(Math.round(num));
const formatQuantityForDisplay = (num) => {
    // 1.5000 0000 format
    if (!num) return '0';
    let str = num.toFixed(8).replace(/\.?0+$/, ''); // Remove trailing zeros

    const parts = str.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); // Integer part commas

    if (parts.length > 1) {
        // Decimal part: space every 4 digits
        parts[1] = parts[1].replace(/(.{4})/g, '$1 ').trim();
    }

    return parts.join('.');
};
const debounce = (func, delay) => {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => func(...args), delay); };
};
let saveTimer;
const debouncedSaveState = () => { clearTimeout(saveTimer); saveTimer = setTimeout(saveState, APP_CONFIG.DEBOUNCE_DELAY); };
const handleCommaInput = (e) => {
    // Save cursor position
    const input = e.target;
    const cursorPosition = input.selectionStart;
    const originalLength = input.value.length;

    let val = input.value.replace(/,/g, '');

    // Check if it's a decimal number
    if (val.includes('.')) {
        const parts = val.split('.');
        // Ensure only one dot
        if (parts.length > 2) {
            val = parts[0] + '.' + parts.slice(1).join('');
        }

        // Format integer part
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

        // Decimal part: NO commas, allow spaces if user types them? 
        // For input fields, standard behavior is usually just numbers. 
        // The 4-digit spacing is primarily for DISPLAY (results). 
        // For Input, let's keep it simple: no commas in decimal part.

        input.value = parts[0] + '.' + parts[1];
    } else {
        if (!isNaN(val) && val !== '') {
            input.value = formatNumberWithCommas(val);
        }
    }

    // Restore cursor (approximate)
    const newLength = input.value.length;
    let newCursorPosition = cursorPosition + (newLength - originalLength);
    if (newCursorPosition < 0) newCursorPosition = 0;
    input.setSelectionRange(newCursorPosition, newCursorPosition);
};

// Logic placeholders for handlers not implemented in this cleanup
// Logic placeholders for handlers not implemented in this cleanup
function handleShare() {
    saveState();
    const state = {
        coin: window.currentCoin,
        qty: initialQtyInput?.value,
        avg: initialAvgPriceInput?.value,
        curr: currentPriceInput?.value
    };
    const params = new URLSearchParams(state).toString();
    const url = `${window.location.origin}${window.location.pathname}?${params}`;

    // Copy to clipboard
    navigator.clipboard.writeText(url).then(() => {
        alert('현재 상태가 담긴 링크가 복사되었습니다!');
    }).catch(err => {
        console.error('클립보드 복사 실패:', err);
        prompt('이 링크를 복사하세요:', url);
    });
}

function handleReset() {
    if (confirm('현재 코인의 입력 데이터를 초기화하시겠습니까?')) {
        // Only reset current coin's data
        let fullState = JSON.parse(localStorage.getItem(STORAGE_KEY)) || { portfolios: {} };
        if (fullState.portfolios && fullState.portfolios[window.currentCoin]) {
            delete fullState.portfolios[window.currentCoin];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(fullState));
        }
        location.reload();
    }
}

function exportData() {
    saveState();
    const dataStr = localStorage.getItem(STORAGE_KEY);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const prefix = isStockMode ? 'stock_calc_backup_' : 'coin_calc_backup_';
    const exportFileDefaultName = `${prefix}${new Date().toISOString().slice(0, 10)}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function importData(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const obj = JSON.parse(event.target.result);
            if (obj && obj.portfolios) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
                alert('데이터가 성공적으로 복원되었습니다.');
                location.reload();
            } else {
                alert('올바르지 않은 백업 파일입니다.');
            }
        } catch (e) {
            alert('파일을 읽는 중 오류가 발생했습니다.');
        }
    };
    reader.readAsText(file);
}

// Window cleanup
// Window cleanup
window.addEventListener('beforeunload', () => {
    if (typeof saveState === 'function') saveState(); // Ensure save on exit
    if (priceUpdateInterval) clearInterval(priceUpdateInterval);
});