
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

/** 애플리케이션 설정 상수 */
const APP_CONFIG = {
    PRICE_UPDATE_INTERVAL: 30000,  // BTC 가격 업데이트 주기 (30초)
    DEBOUNCE_DELAY: 500,           // 자동 저장 지연 시간 (0.5초)
    WORKER_CACHE_SECONDS: 20       // Worker 캐시 시간 (20초)
};

// ============================================================
// 메인 애플리케이션 초기화
// ============================================================

// Modules are deferred by default, so the DOM is ready when this runs.
// We don't need window.addEventListener('load', ...) wrapper for the entire file.

// --- Common Elements ---
const themeToggleBtn = document.getElementById('theme-toggle');

// --- Theme switching logic ---
if (themeToggleBtn) {
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
        document.body.classList.add('dark');
    }
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        let theme = document.body.classList.contains('dark') ? 'dark' : 'light';
        localStorage.setItem('theme', theme);
    });
}

// --- Lotto Number Generator Logic ---
const generateBtn = document.getElementById('generate-btn');
if (generateBtn) {
    const lottoNumbersContainer = document.querySelector('.lotto-numbers');
    const historyList = document.getElementById('history-list');
    if (lottoNumbersContainer && historyList) {
        function generateLottoNumbers() {
            const numbers = [];
            while (numbers.length < 6) {
                const randomNumber = Math.floor(Math.random() * 45) + 1;
                if (!numbers.includes(randomNumber)) numbers.push(randomNumber);
            }
            numbers.sort((a, b) => a - b);
            displayNumbers(numbers);
            addToHistory(numbers);
        }
        function displayNumbers(numbers) {
            lottoNumbersContainer.innerHTML = '';
            numbers.forEach(num => {
                const span = document.createElement('span');
                span.className = 'number';
                span.textContent = num;
                lottoNumbersContainer.appendChild(span);
            });
        }
        function addToHistory(numbers) {
            const listItem = document.createElement('li');
            listItem.textContent = numbers.join(', ');
            historyList.prepend(listItem);
        }
        generateBtn.addEventListener('click', generateLottoNumbers);
        generateLottoNumbers();
    }
}

// --- Water Down Calculator Logic ---
if (document.getElementById('calculate-btn')) {
    // --- Element Hooks ---
    const currentPriceInput = document.getElementById('current-price');
    const calculationPriceInput = document.getElementById('calculation-price');
    const calcModeToggle = document.getElementById('calc-mode-toggle');
    const calcModeLabel = document.getElementById('calc-mode-label');
    const initialQtyInput = document.getElementById('initial-qty');
    const initialAvgPriceInput = document.getElementById('initial-avg-price');
    const transactionList = document.getElementById('transaction-list');
    const addTransactionBtn = document.getElementById('add-transaction-btn');
    const calculateBtn = document.getElementById('calculate-btn');
    const shareBtn = document.getElementById('share-btn');
    const resetBtn = document.getElementById('reset-btn');
    const resultsContainer = document.getElementById('results-container');
    const transactionRowTemplate = document.getElementById('transaction-row-template');
    const whatifAmountInput = document.getElementById('whatif-amount');
    const whatifCalculateBtn = document.getElementById('whatif-calculate-btn');
    const whatifResultDisplay = document.getElementById('whatif-result');
    const targetAvgPriceInput = document.getElementById('target-avg-price');
    const targetCalculateBtn = document.getElementById('target-calculate-btn');
    const targetResultDisplay = document.getElementById('target-result');

    // Visual Comparison Elements
    const visualContainer = document.getElementById('whatif-visual-container');
    const visualCurrentPrice = document.getElementById('visual-current-price');
    const visualNewPrice = document.getElementById('visual-new-price');
    const barCurrent = document.getElementById('bar-current');
    const barNew = document.getElementById('bar-new');

    const resultSpans = {
        totalQty: document.getElementById('result-total-qty'),
        totalInvestment: document.getElementById('result-total-investment'),
        finalAvgPrice: document.getElementById('result-final-avg-price'),
        totalEvaluation: document.getElementById('result-total-evaluation'),
        pnl: document.getElementById('result-pnl'),
        returnRate: document.getElementById('result-return-rate'),
    };

    // --- State ---
    let calculationMode = 'exchange';
    let priceUpdateInterval;

    // Detect Mode
    const isStockMode = document.body.classList.contains('stock-theme');
    const STORAGE_KEY = isStockMode ? 'stockCalcState' : 'waterDownCalcState';

    // 전역 변수로 노출 (coin-selector.js에서 접근 가능)
    // 주식 모드일 경우 삼성전자(005930), 코인 모드일 경우 BTC 기본값
    window.currentCoin = isStockMode ? '005930' : 'BTC';
    let currentCoin = window.currentCoin;

    let allCoins = []; // Upbit API에서 가져온 전체 코인 목록
    let customCoins = JSON.parse(localStorage.getItem('customCoins')) || []; // 사용자 추가 코인

    // --- Persistence (고도화된 버전 관리 및 다중 코인 구조) ---
    const CURRENT_DATA_VERSION = 1;

    /**
     * 현재 상태를 localStorage에 저장합니다.
     */
    function saveState() {
        // 기존에 저장된 전체 상태 로드
        let fullState = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
            version: CURRENT_DATA_VERSION,
            portfolios: {}
        };

        // 현재 화면의 데이터를 코인별 포트폴리오에 업데이트
        fullState.version = CURRENT_DATA_VERSION;
        fullState.lastUpdated = new Date().toISOString();
        fullState.activeCoin = window.currentCoin;

        fullState.portfolios[window.currentCoin] = {
            calcMode: calcModeToggle.checked,
            initialQty: initialQtyInput.value,
            initialAvgPrice: initialAvgPriceInput.value,
            transactions: Array.from(document.querySelectorAll('.transaction-row')).map(row => ({
                type: row.querySelector('.transaction-type').value,
                qty: row.querySelector('.transaction-qty').value,
                price: row.querySelector('.transaction-price').value,
            })),
            // 계산 관련 입력값 저장
            calculationPrice: calculationPriceInput.value,
            whatifAmount: whatifAmountInput.value,
            targetAvgPrice: targetAvgPriceInput.value
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(fullState));
    }

    /**
     * 저장된 상태를 불러오고, 구버전 데이터인 경우 마이그레이션(구조 변환)을 수행합니다.
     */
    function loadState(savedData) {
        if (!savedData) return;

        let stateToLoad = savedData;

        // [마이그레이션 로직] 구버전(버전 정보가 없는 데이터)일 경우 버전 1 구조로 변환
        if (!stateToLoad.version) {
            console.log('구버전 데이터를 감지했습니다. 마이그레이션을 시작합니다...');
            const oldData = stateToLoad;
            // 주식 모드는 구버전이 없으므로 BTC 로직만 유지
            const defaultCoin = isStockMode ? '005930' : 'BTC';

            stateToLoad = {
                version: CURRENT_DATA_VERSION,
                activeCoin: defaultCoin,
                portfolios: {}
            };

            // 코인 모드일 때만 구버전 데이터 마이그레이션
            if (!isStockMode) {
                stateToLoad.portfolios['BTC'] = {
                    calcMode: oldData.calcMode || false,
                    initialQty: oldData.initialQty || '',
                    initialAvgPrice: oldData.initialAvgPrice || '',
                    transactions: oldData.transactions || []
                };
            }

            // 변환된 데이터 즉시 저장
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToLoad));
        }

        // 활성 코인 설정
        if (stateToLoad.activeCoin) {
            window.currentCoin = stateToLoad.activeCoin;
        }

        // 현재 활성화된 코인의 데이터 추출
        const portfolio = stateToLoad.portfolios && stateToLoad.portfolios[window.currentCoin];

        if (!portfolio) return;


        calcModeToggle.checked = portfolio.calcMode;
        updateMode();
        initialQtyInput.value = portfolio.initialQty;
        initialAvgPriceInput.value = portfolio.initialAvgPrice;
        transactionList.innerHTML = '';
        if (portfolio.transactions) {
            portfolio.transactions.forEach(addTransactionRow);
        }
    }

    /**
     * 특정 코인의 저장된 데이터를 불러옵니다.
     */
    /**
     * 특정 코인의 저장된 데이터를 불러옵니다.
     */
    function loadCoinData(coinSymbol) {
        // localStorage에서 전체 상태 가져오기
        const fullState = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
            version: CURRENT_DATA_VERSION,
            portfolios: {}
        };

        // 해당 코인의 포트폴리오 데이터 확인
        const portfolio = fullState.portfolios && fullState.portfolios[coinSymbol];

        if (portfolio) {
            // 데이터가 있는 경우: 저장된 값 복원
            console.log(`${coinSymbol} 코인의 저장된 데이터를 불러옵니다.`);
            calcModeToggle.checked = portfolio.calcMode || false;
            updateMode();
            initialQtyInput.value = portfolio.initialQty || '';
            initialAvgPriceInput.value = portfolio.initialAvgPrice || '';

            // 거래 내역 복원
            transactionList.innerHTML = '';
            if (portfolio.transactions && portfolio.transactions.length > 0) {
                portfolio.transactions.forEach(addTransactionRow);
            }

            // 계산 관련 입력값 복원
            calculationPriceInput.value = portfolio.calculationPrice || '';
            whatifAmountInput.value = portfolio.whatifAmount || '';
            targetAvgPriceInput.value = portfolio.targetAvgPrice || '';
        } else {
            // 데이터가 없는 경우: 빈 상태로 초기화
            console.log(`${coinSymbol} 코인의 저장된 데이터가 없습니다. 빈 상태로 시작합니다.`);
            calcModeToggle.checked = false;
            updateMode();
            initialQtyInput.value = '';
            initialAvgPriceInput.value = '';
            transactionList.innerHTML = '';

            // 결과 화면 숨기기
            resultsContainer.style.display = 'none';
        }

        // What-if 및 목표 평단가 결과 초기화
        if (whatifResultDisplay) {
            whatifResultDisplay.textContent = '';
        }
        if (targetResultDisplay) {
            targetResultDisplay.textContent = '';
        }

        // What-if Visual Bars Reset
        if (visualContainer) {
            visualContainer.style.display = 'none';
        }

        // 계산 관련 입력값 초기화 (데이터가 없는 경우에만)
        if (!portfolio) {
            whatifAmountInput.value = '';
            targetAvgPriceInput.value = '';
            // 계산 기준 가격은 현재가로 설정 (코인 모드일 경우에만)
            if (!isStockMode && !calculationPriceInput.value) {
                const currentPrice = safeParseFloat(currentPriceInput.value);
                if (currentPrice > 0) {
                    calculationPriceInput.value = formatNumberWithCommas(currentPrice);
                }
            }
        }
    }


    // 전역 함수로 노출 (coin-selector.js에서 사용)
    window.saveState = saveState;
    window.loadCoinData = loadCoinData;

    // --- UI Functions ---
    function addTransactionRow(tx) {
        const newRow = transactionRowTemplate.content.cloneNode(true);
        if (tx) {
            newRow.querySelector('.transaction-type').value = tx.type;
            newRow.querySelector('.transaction-qty').value = tx.qty;
            newRow.querySelector('.transaction-price').value = tx.price;
        }
        const removeBtn = newRow.querySelector('.remove-transaction-btn');
        transactionList.appendChild(newRow);
        attachRemoveListener(removeBtn);
    }

    function attachRemoveListener(button) {
        button.addEventListener('click', (e) => {
            e.target.closest('.transaction-row').remove();
            saveState();
        });
    }

    function updateMode() {
        if (calcModeToggle.checked) {
            calculationMode = 'wallet';
            calcModeLabel.textContent = '내 지갑 기준';
        } else {
            calculationMode = 'exchange';
            calcModeLabel.textContent = '거래소 기준';
        }
    }

    // --- API Fetching ---
    async function fetchCurrentCoinPrice() {
        // 주식 모드이거나 커스텀 코인인 경우 자동 가격 가져오기 안함
        if (isStockMode) return;
        if (window.coinSelector && window.coinSelector.getCurrentCoin()?.isCustom) {
            return;
        }

        try {
            const market = `KRW-${window.currentCoin}`;
            const workerUrl = `https://upbit-proxy.ooktone.workers.dev/v1/ticker?markets=${market}`;
            const response = await fetch(workerUrl);
            if (!response.ok) throw new Error(`API response not OK: ${response.status}`);
            const data = await response.json();
            if (data && data.length > 0) {
                const price = data[0].trade_price;
                currentPriceInput.value = price.toLocaleString();
                // Only update calculation price if it's empty, allowing user override
                if (!calculationPriceInput.value) {
                    calculationPriceInput.value = price;
                }
            } else {
                throw new Error('API returned empty data.');
            }
        } catch (error) {
            console.error(`${window.currentCoin} 가격 로드 실패:`, error.message);
            if (!currentPriceInput.value) {
                currentPriceInput.value = '가격 로드 실패';
            }
        }
    }

    // ============================================================
    // 유틸리티 함수
    // ============================================================

    /**
     * 숫자에 천 단위 콤마를 추가합니다.
     */
    const formatNumberWithCommas = (num) => {
        if (typeof num !== 'number' && typeof num !== 'string') return '';
        const parts = String(num).split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    };

    /**
     * 통화(KRW)를 표시용 HTML로 포맷합니다.
     */
    const formatCurrencyForDisplay = (num) => {
        if (typeof num !== 'number' || !isFinite(num)) return '-';
        const roundedNum = Math.round(num);
        return `<span class="int-part">${formatNumberWithCommas(roundedNum)}</span>`;
    };

    /**
     * 코인 수량을 표시용 HTML로 포맷합니다.
     */
    const formatQuantityForDisplay = (num) => {
        if (typeof num !== 'number' || !isFinite(num)) return '-';
        const fixedNum = num.toFixed(8); // BTC는 소수점 8자리까지 지원
        const [intPart, decPart] = fixedNum.split('.');
        if (parseInt(decPart, 10) === 0) {
            return `<span class="int-part">${formatNumberWithCommas(intPart)}</span>`;
        }
        const trimmedDecPart = decPart.replace(/0+$/, ''); // 끝자리 0 제거
        return `<span class="int-part">${formatNumberWithCommas(intPart)}</span><span class="dec-part">.${trimmedDecPart}</span>`;
    };

    // --- Input Formatting Logic ---
    const handleCommaInput = (e) => {
        const input = e.target;
        if (input.value === '') {
            input.dataset.prevValue = '';
            return;
        }
        const originalValue = input.value;
        const numericValue = originalValue.replace(/,/g, '');
        if (isNaN(numericValue) && numericValue !== '' && numericValue !== '.') {
            input.value = input.dataset.prevValue || '';
            return;
        }
        input.dataset.prevValue = numericValue;
        const formattedValue = formatNumberWithCommas(numericValue);
        if (input.value !== formattedValue) {
            input.value = formattedValue;
        }
    };

    // --- Event Listener for Comma Formatting ---
    document.body.addEventListener('input', (e) => {
        if (e.target.classList.contains('comma-input')) {
            handleCommaInput(e);
        }
    });

    // --- Auto-fill Current Price Logic ---
    calculationPriceInput.addEventListener('input', () => {
        if (calculationPriceInput.value === '') {
            const currentPrice = safeParseFloat(currentPriceInput.value);
            if (currentPrice > 0) {
                calculationPriceInput.value = formatNumberWithCommas(currentPrice);
            }
        }
    });

    // ============================================================
    // 핵심 계산 로직 (Refactored to use Modules)
    // ============================================================

    /**
     * 메인 물타기 계산 함수
     */
    function calculate() {
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
        const currentPrice = safeParseFloat(currentPriceInput.value);
        const totalEvaluation = finalQty * currentPrice;
        const pnl = totalEvaluation - finalCost;
        const returnRate = (finalCost > 0) ? (pnl / finalCost) * 100 : 0;

        resultSpans.totalQty.innerHTML = formatQuantityForDisplay(finalQty);
        resultSpans.totalInvestment.innerHTML = `${formatCurrencyForDisplay(finalCost)} KRW`;
        resultSpans.finalAvgPrice.innerHTML = `${formatCurrencyForDisplay(finalAvgPrice)} KRW`;
        resultSpans.totalEvaluation.innerHTML = `${formatCurrencyForDisplay(totalEvaluation)} KRW`;
        resultSpans.pnl.innerHTML = `${formatCurrencyForDisplay(pnl)} KRW`;
        resultSpans.returnRate.textContent = returnRate.toFixed(2) + ' %';

        resultsContainer.style.display = 'block';
        saveState();
    }

    // ============================================================
    // 보조 계산 함수
    // ============================================================

    /**
     * 현재 입력된 거래 내역을 기반으로 누적 매수 정보를 계산합니다.
     */
    function getPreCalculationState() {
        let totalBuyQty = safeParseFloat(initialQtyInput.value);
        let totalBuyCost = totalBuyQty * safeParseFloat(initialAvgPriceInput.value);
        document.querySelectorAll('.transaction-row').forEach(row => {
            const type = row.querySelector('.transaction-type').value;
            const qty = safeParseFloat(row.querySelector('.transaction-qty').value);
            const price = safeParseFloat(row.querySelector('.transaction-price').value);
            if (qty > 0 && price >= 0 && type === 'buy') {
                totalBuyQty += qty;
                totalBuyCost += qty * price;
            }
        });
        return { totalBuyQty, totalBuyCost };
    }

    // ============================================================
    // What-if 계산
    // ============================================================

    function calculateWhatif() {
        const amount = safeParseFloat(whatifAmountInput.value);
        const calcPrice = safeParseFloat(calculationPriceInput.value);

        const { totalBuyQty, totalBuyCost } = getPreCalculationState();

        // Check for valid current state
        const currentAvgBuyPrice = (totalBuyQty > 0) ? totalBuyCost / totalBuyQty : 0;

        if (currentAvgBuyPrice === 0) {
            whatifResultDisplay.textContent = '먼저 보유 수량과 평단가를 입력해야 비교할 수 있습니다.';
            visualContainer.style.display = 'none';
            return;
        }

        const result = calculateWhatIf(totalBuyQty, totalBuyCost, amount, calcPrice);

        if (!result) { // Invalid inputs
            whatifResultDisplay.textContent = '유효한 금액과 계산 기준 가격을 입력하세요.';
            visualContainer.style.display = 'none';
            return;
        }

        const { newAvgPrice, changePercent, direction } = result;

        // 이모지와 긍정 표현으로 의미 전달
        let changeText;
        let changeClass;

        if (direction === 'improvement') {
            changeText = `✅ ${changePercent.toFixed(2)}% 개선`;
            changeClass = 'improvement';
        } else if (direction === 'warning') {
            changeText = `⚠️ ${changePercent.toFixed(2)}% 상승`;
            changeClass = 'warning';
        } else {
            changeText = '변화 없음';
            changeClass = 'neutral';
        }

        whatifResultDisplay.innerHTML = `
            예상 평단가: <span class="result-value">${formatCurrencyForDisplay(newAvgPrice)} KRW</span>
            <span class="${changeClass}">${changeText}</span>
        `;

        // Update Visual Bars
        visualContainer.style.display = 'block';
        visualCurrentPrice.innerHTML = formatCurrencyForDisplay(currentAvgBuyPrice) + ' KRW';
        visualNewPrice.innerHTML = formatCurrencyForDisplay(newAvgPrice) + ' KRW';

        // Calculate widths with "Focus Scale" (Zoomed In)
        // 0부터 시작하면 미세한 차이가 안 보이므로, 최소값의 80% 지점을 0%로 잡습니다.
        const minScale = Math.min(currentAvgBuyPrice, newAvgPrice) * 0.8;
        const maxScale = Math.max(currentAvgBuyPrice, newAvgPrice) * 1.05; // 여유 공간 5%
        const span = maxScale - minScale;

        const calcWidth = (price) => {
            let pct = ((price - minScale) / span) * 100;
            return Math.max(5, Math.min(100, pct)); // 최소 5%, 최대 100%
        };

        const currentWidth = calcWidth(currentAvgBuyPrice);
        const newWidth = calcWidth(newAvgPrice);

        barCurrent.style.width = `${currentWidth}%`;
        barNew.style.width = `${newWidth}%`;

        // Set color class
        barNew.className = 'visual-bar bar-new ' + direction;
    }

    // What-if 자동 계산 (디바운싱)
    if (whatifCalculateBtn && whatifAmountInput) {
        let whatifTimer;
        whatifAmountInput.addEventListener('input', () => {
            clearTimeout(whatifTimer);
            whatifTimer = setTimeout(() => {
                calculateWhatif();
            }, 500);
        });
        whatifCalculateBtn.addEventListener('click', () => {
            clearTimeout(whatifTimer);
            calculateWhatif();
        });
    }


    // ============================================================
    // 목표 평단가 계산
    // ============================================================

    function calculateTargetPrice() {
        const targetPrice = safeParseFloat(targetAvgPriceInput.value);
        const calcPrice = safeParseFloat(calculationPriceInput.value);
        const { totalBuyQty, totalBuyCost } = getPreCalculationState();

        // 유효성 검사 및 계산 위임
        const result = calculateTargetRequiredQty(totalBuyQty, totalBuyCost, targetPrice, calcPrice);

        if (result.error) {
            targetResultDisplay.textContent = result.error;
            return;
        }

        const { requiredQty, requiredAmount } = result;
        const coinSymbol = window.currentCoin || 'BTC';

        targetResultDisplay.innerHTML = `
            💰 필요 투자금: <span class="result-value">${formatCurrencyForDisplay(requiredAmount)} KRW</span><br>
            📊 <span class="result-value">${formatQuantityForDisplay(requiredQty)}</span> ${coinSymbol} 추가 매수 필요
        `;
    }

    // 목표 평단가 자동 계산 (디바운싱)
    if (targetCalculateBtn && targetAvgPriceInput) {
        let targetTimer;
        targetAvgPriceInput.addEventListener('input', () => {
            clearTimeout(targetTimer);
            targetTimer = setTimeout(() => {
                calculateTargetPrice();
            }, 500);
        });
        targetCalculateBtn.addEventListener('click', () => {
            clearTimeout(targetTimer);
            calculateTargetPrice();
        });
    }

    // ============================================================
    // 이벤트 리스너 등록
    // ============================================================

    // 디바운스된 자동 저장 (500ms 지연)
    let saveTimer;
    const debouncedSaveState = () => {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(saveState, APP_CONFIG.DEBOUNCE_DELAY);
    };

    [initialQtyInput, initialAvgPriceInput, currentPriceInput, calculationPriceInput].forEach(el => el.addEventListener('input', debouncedSaveState));
    transactionList.addEventListener('input', debouncedSaveState);
    calcModeToggle.addEventListener('change', () => { updateMode(); saveState(); });
    addTransactionBtn.addEventListener('click', () => addTransactionRow());
    calculateBtn.addEventListener('click', calculate);

    // ============================================================
    // 백업 및 복원 (Export/Import)
    // ============================================================

    function exportData() {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) {
            alert('저장된 데이터가 없습니다.');
            return;
        }
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const date = new Date().toISOString().split('T')[0];
        const typeName = isStockMode ? 'stock' : 'coin';
        a.href = url;
        a.download = `water-down-${typeName}-backup-${date}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    function importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                const parsed = JSON.parse(content);
                if (!parsed.version && !parsed.calcMode) {
                    throw new Error('유효한 데이터 형식이 아닙니다.');
                }
                if (confirm('현재 모든 데이터가 백업 파일의 데이터로 대체됩니다. 진행하시겠습니까?')) {
                    localStorage.setItem(STORAGE_KEY, content);
                    alert('데이터가 성공적으로 복원되었습니다.');
                    location.reload();
                }
            } catch (err) {
                console.error('복원 중 에러:', err);
                alert('유효한 백업 파일이 아닙니다: ' + err.message);
            }
        };
        reader.readAsText(file);
    }

    // --- Event Listeners ---
    const backupBtn = document.getElementById('backup-btn');
    const restoreBtn = document.getElementById('restore-btn');
    const fileInput = document.getElementById('file-input');

    if (backupBtn) backupBtn.addEventListener('click', exportData);
    if (restoreBtn && fileInput) {
        restoreBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                importData(e.target.files[0]);
            }
        });
    }

    shareBtn.addEventListener('click', () => {
        saveState();
        const state = localStorage.getItem(STORAGE_KEY) || '{}';
        const encodedState = btoa(encodeURIComponent(state));
        let origin = window.location.origin;
        if (origin === 'null' || !origin) {
            origin = window.location.protocol + '//' + window.location.hostname;
            if (window.location.protocol === 'file:') {
                alert('현재 로컬 파일 상태로 이용 중입니다. 공유 링크는 웹 서버(http://) 환경에서 정상 작동하며, 로컬에서는 데이터 복사 용도로만 사용됩니다.');
            }
        }
        const url = `${origin}${window.location.pathname}?data=${encodedState}`;
        navigator.clipboard.writeText(url).then(() => {
            alert('공유 링크가 클립보드에 복사되었습니다!\n(로컬 환경의 경우 웹 서버에서 열어야 링크가 유효합니다.)');
        }, () => {
            alert('링크 복사에 실패했습니다.');
        });
    });

    resetBtn.addEventListener('click', () => {
        if (confirm('정말 모든 데이터를 초기화하시겠습니까?')) {
            localStorage.removeItem(STORAGE_KEY);
            window.location.href = window.location.pathname;
        }
    });

    // --- Initial Load ---
    function initialize() {
        const urlParams = new URLSearchParams(window.location.search);
        const encodedData = urlParams.get('data');
        let stateToLoad = null;
        if (encodedData) {
            try {
                stateToLoad = JSON.parse(decodeURIComponent(atob(encodedData)));
            } catch (e) {
                console.error('Error loading state from URL, falling back to localStorage:', e);
                stateToLoad = JSON.parse(localStorage.getItem(STORAGE_KEY));
            }
        } else {
            stateToLoad = JSON.parse(localStorage.getItem(STORAGE_KEY));
        }
        loadState(stateToLoad);

        // 초기 가격 조회
        fetchCurrentCoinPrice();
        // 30초마다 자동 업데이트
        priceUpdateInterval = setInterval(fetchCurrentCoinPrice, APP_CONFIG.PRICE_UPDATE_INTERVAL);
    }

    // ============================================================
    // 메모리 누수 방지: 페이지 이탈 시 인터벌 정리
    // ============================================================
    window.addEventListener('beforeunload', () => {
        if (priceUpdateInterval) {
            clearInterval(priceUpdateInterval);
        }
    });

    initialize();
}