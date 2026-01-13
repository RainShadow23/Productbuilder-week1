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

window.addEventListener('load', () => {

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
        if (!lottoNumbersContainer || !historyList) return;

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

        // 전역 변수로 노출 (coin-selector.js에서 접근 가능)
        window.currentCoin = 'BTC'; // 현재 선택된 코인
        let currentCoin = window.currentCoin; // 로컬 참조

        let allCoins = []; // Upbit API에서 가져온 전체 코인 목록
        let customCoins = JSON.parse(localStorage.getItem('customCoins')) || []; // 사용자 추가 코인

        // --- Persistence (고도화된 버전 관리 및 다중 코인 구조) ---
        const CURRENT_DATA_VERSION = 1;

        /**
         * 현재 상태를 localStorage에 저장합니다.
         * 새로운 데이터 구조: { version, lastUpdated, activeCoin, portfolios: { CODE: { ... } } }
         */
        function saveState() {
            // 기존에 저장된 전체 상태 로드
            let fullState = JSON.parse(localStorage.getItem('waterDownCalcState')) || {
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

            localStorage.setItem('waterDownCalcState', JSON.stringify(fullState));
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
                stateToLoad = {
                    version: CURRENT_DATA_VERSION,
                    activeCoin: 'BTC',
                    portfolios: {
                        'BTC': {
                            calcMode: oldData.calcMode || false,
                            initialQty: oldData.initialQty || '',
                            initialAvgPrice: oldData.initialAvgPrice || '',
                            transactions: oldData.transactions || []
                        }
                    }
                };
                // 변환된 데이터 즉시 저장
                localStorage.setItem('waterDownCalcState', JSON.stringify(stateToLoad));
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
         * 데이터가 있으면 복원하고, 없으면 빈 상태로 초기화합니다.
         * @param {string} coinSymbol - 불러올 코인 심볼 (예: 'BTC', 'ETH')
         */
        function loadCoinData(coinSymbol) {
            // localStorage에서 전체 상태 가져오기
            const fullState = JSON.parse(localStorage.getItem('waterDownCalcState')) || {
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

            // 계산 관련 입력값 초기화 (데이터가 없는 경우에만)
            if (!portfolio) {
                whatifAmountInput.value = '';
                targetAvgPriceInput.value = '';
                // 계산 기준 가격은 현재가로 설정 (빈 값이면 자동 입력됨)
                if (!calculationPriceInput.value) {
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
            // 커스텀 코인인 경우 자동 가격 가져오기 안함
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
                // Set the value, not placeholder, to show the error
                if (!currentPriceInput.value) {
                    currentPriceInput.value = '가격 로드 실패';
                }
            }
        }

        // ============================================================
        // 유틸리티 함수
        // ============================================================

        /**
         * 문자열을 숫자로 안전하게 변환합니다.
         * 콤마(,)를 제거하고 유효한 숫자로 파싱하며, 실패 시 0을 반환합니다.
         * @param {string|number} str - 변환할 문자열 또는 숫자
         * @returns {number} 파싱된 숫자 또는 0
         */
        const safeParseFloat = (str) => parseFloat(String(str || '').replace(/,/g, '')) || 0;

        /**
         * 숫자에 천 단위 콤마를 추가합니다.
         * @param {number|string} num - 포맷할 숫자
         * @returns {string} 콤마가 추가된 문자열
         * @example formatNumberWithCommas(1234567.89) => "1,234,567.89"
         */
        const formatNumberWithCommas = (num) => {
            if (typeof num !== 'number' && typeof num !== 'string') return '';
            const parts = String(num).split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            return parts.join('.');
        };

        /**
         * 통화(KRW)를 표시용 HTML로 포맷합니다.
         * 정수 부분을 강조하는 span 태그로 감쌉니다.
         * @param {number} num - 통화 금액
         * @returns {string} HTML 문자열
         */
        const formatCurrencyForDisplay = (num) => {
            if (typeof num !== 'number' || !isFinite(num)) return '-';
            const roundedNum = Math.round(num);
            return `<span class="int-part">${formatNumberWithCommas(roundedNum)}</span>`;
        };

        /**
         * 코인 수량을 표시용 HTML로 포맷합니다.
         * 정수 부분은 크게, 소수점 부분은 작게 표시하며, 불필요한 끝자리 0은 제거합니다.
         * @param {number} num - 코인 수량
         * @returns {string} HTML 문자열
         * @example formatQuantityForDisplay(1.23000000) => '<span class="int-part">1</span><span class="dec-part">.23</span>'
         */
        const formatQuantityForDisplay = (num) => {
            if (typeof num !== 'number' || !isFinite(num)) return '-';
            const fixedNum = num.toFixed(8); // BTC는 소수점 8자리까지 지원
            const [intPart, decPart] = fixedNum.split('.');
            // 정수인 경우 소수점 표시 안함
            if (parseInt(decPart, 10) === 0) {
                return `<span class="int-part">${formatNumberWithCommas(intPart)}</span>`;
            }
            const trimmedDecPart = decPart.replace(/0+$/, ''); // 끝자리 0 제거
            return `<span class="int-part">${formatNumberWithCommas(intPart)}</span><span class="dec-part">.${trimmedDecPart}</span>`;
        };

        // --- Input Formatting Logic ---
        const handleCommaInput = (e) => {
            const input = e.target;
            if (input.value === '') { // Allow clearing the input
                input.dataset.prevValue = '';
                return;
            }
            const originalValue = input.value;
            const numericValue = originalValue.replace(/,/g, '');
            if (isNaN(numericValue) && numericValue !== '' && numericValue !== '.') {
                input.value = input.dataset.prevValue || ''; // Restore previous valid value if input is invalid
                return;
            }
            input.dataset.prevValue = numericValue; // Store the clean numeric value
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
                // If input is cleared, try to auto-fill with current price
                const currentPrice = safeParseFloat(currentPriceInput.value);
                if (currentPrice > 0) {
                    calculationPriceInput.value = formatNumberWithCommas(currentPrice);
                }
            }
        });

        // ============================================================
        // 핵심 계산 로직
        // ============================================================

        /**
         * 메인 물타기 계산 함수
         * 두 가지 모드를 지원:
         * 1) 거래소 기준: 매수 평균만 계산하고 매도는 수량만 차감
         * 2) 지갑 기준: 매도 시 실현 손익을 반영하여 평균 단가 조정
         */
        function calculate() {
            let initialQty = safeParseFloat(initialQtyInput.value);
            let initialCost = initialQty * safeParseFloat(initialAvgPriceInput.value);

            const transactions = Array.from(document.querySelectorAll('.transaction-row')).map(row => ({
                type: row.querySelector('.transaction-type').value,
                qty: safeParseFloat(row.querySelector('.transaction-qty').value),
                price: safeParseFloat(row.querySelector('.transaction-price').value),
            }));

            let finalQty = initialQty;
            let finalCost = initialCost;

            // [거래소 기준 모드]
            // 매수만 평균 단가에 반영하고, 매도는 수량만 차감
            // 잔고 = (전체 매수량 - 전체 매도량)
            // 평균 매수가 = (전체 매수 금액) / (전체 매수 수량)
            if (calculationMode === 'exchange') {
                let totalBuyQty = initialQty;
                let totalBuyCost = initialCost;
                let totalSellQty = 0;

                transactions.forEach(tx => {
                    if (tx.qty > 0 && tx.price >= 0) {
                        if (tx.type === 'buy') {
                            totalBuyQty += tx.qty;
                            totalBuyCost += tx.qty * tx.price;
                        } else {
                            totalSellQty += tx.qty;
                        }
                    }
                });
                const avgBuyPrice = (totalBuyQty > 0) ? totalBuyCost / totalBuyQty : 0;
                finalQty = totalBuyQty - totalSellQty;
                finalCost = finalQty * avgBuyPrice;

            } else {
                // [지갑 기준 모드]
                // 매도 시 실현 손익을 투자금액에서 차감
                // 예: 평단가 100원에 매도가 120원이면 20원 이익 실현 → 투자금액 감소
                transactions.forEach(tx => {
                    if (tx.qty > 0 && tx.price >= 0) {
                        if (tx.type === 'buy') {
                            finalCost += tx.qty * tx.price;
                            finalQty += tx.qty;
                        } else {
                            if (finalQty > 0) {
                                // 매도 직전의 평균 단가 계산
                                const avgPriceBeforeSell = finalCost / finalQty;
                                // 실현 손익 = (매도가 - 평단가) × 매도 수량
                                const profit = (tx.price - avgPriceBeforeSell) * Math.min(tx.qty, finalQty);
                                // 실현 손익만큼 투자금액 조정 (이익이면 감소, 손실이면 증가)
                                finalCost -= profit;
                                finalQty -= tx.qty;
                            }
                        }
                    }
                });
            }

            finalQty = (finalQty < 0) ? 0 : finalQty;
            const finalAvgPrice = (finalQty > 0) ? finalCost / finalQty : 0;
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
         * What-if 계산과 목표 평단가 계산에서 공통으로 사용됩니다.
         * @returns {{totalBuyQty: number, totalBuyCost: number}} 총 매수 수량과 비용
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

        /**
         * What-if 계산 함수
         * 추가 매수 금액을 입력했을 때 예상 평단가를 계산합니다.
         */
        function calculateWhatif() {
            const amount = safeParseFloat(whatifAmountInput.value);
            const calcPrice = safeParseFloat(calculationPriceInput.value);

            if (amount <= 0 || calcPrice <= 0) {
                whatifResultDisplay.textContent = '유효한 금액과 계산 기준 가격을 입력하세요.';
                return;
            }

            const { totalBuyQty, totalBuyCost } = getPreCalculationState();
            const currentAvgBuyPrice = (totalBuyQty > 0) ? totalBuyCost / totalBuyQty : 0;

            if (currentAvgBuyPrice === 0) {
                whatifResultDisplay.textContent = '먼저 보유 수량과 평단가를 입력해야 비교할 수 있습니다.';
                return;
            }

            const additionalQty = amount / calcPrice;
            const newTotalBuyQty = totalBuyQty + additionalQty;
            const newTotalBuyCost = totalBuyCost + amount;
            const newAvgPrice = (newTotalBuyQty > 0) ? newTotalBuyCost / newTotalBuyQty : 0;

            // 평단가 변화율 계산 (절대값)
            const changePercent = Math.abs(((newAvgPrice - currentAvgBuyPrice) / currentAvgBuyPrice) * 100);

            // 이모지와 긍정 표현으로 의미 전달
            let changeText;
            let changeClass;

            if (newAvgPrice < currentAvgBuyPrice) {
                // 평단가 하락 (좋음!)
                changeText = `✅ ${changePercent.toFixed(2)}% 개선`;
                changeClass = 'improvement';
            } else if (newAvgPrice > currentAvgBuyPrice) {
                // 평단가 상승 (주의)
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
        }

        // What-if 자동 계산 (디바운싱)
        if (whatifCalculateBtn && whatifAmountInput) {
            let whatifTimer;

            // 입력 시 자동 계산 (500ms 지연)
            whatifAmountInput.addEventListener('input', () => {
                clearTimeout(whatifTimer);
                whatifTimer = setTimeout(() => {
                    calculateWhatif();
                }, 500);
            });

            // 버튼 클릭 시 즉시 계산
            whatifCalculateBtn.addEventListener('click', () => {
                clearTimeout(whatifTimer);
                calculateWhatif();
            });
        }


        // ============================================================
        // 목표 평단가 계산
        // ============================================================

        /**
         * 목표 평단가 계산 함수
         * 목표 평단가를 달성하기 위해 필요한 추가 매수 금액을 계산합니다.
         */
        function calculateTargetPrice() {
            const targetPrice = safeParseFloat(targetAvgPriceInput.value);
            const calcPrice = safeParseFloat(calculationPriceInput.value);

            if (targetPrice <= 0 || calcPrice <= 0) {
                targetResultDisplay.textContent = '유효한 목표 평단가와 계산 기준 가격을 입력하세요.';
                return;
            }

            const { totalBuyQty, totalBuyCost } = getPreCalculationState();
            const currentAvgBuyPrice = (totalBuyQty > 0) ? totalBuyCost / totalBuyQty : 0;

            // ============================================================
            // 입력값 사전 검증
            // ============================================================

            // [검증 1] 보유 수량이 없는 경우
            if (currentAvgBuyPrice === 0) {
                targetResultDisplay.textContent = '보유 수량이 없어 평단가를 계산할 수 없습니다. 기본 정보를 먼저 입력하세요.';
                return;
            }

            // [검증 2] 물타기가 불가능한 경우
            if (currentAvgBuyPrice <= calcPrice) {
                targetResultDisplay.textContent = `현재 평단가(${Math.round(currentAvgBuyPrice).toLocaleString()}원)가 계산 기준 가격(${calcPrice.toLocaleString()}원)보다 낮거나 같아 평단가를 더 낮출 수 없습니다.`;
                return;
            }

            // [검증 3] 목표 가격이 논리적으로 불가능한 경우
            if (targetPrice >= currentAvgBuyPrice) {
                targetResultDisplay.textContent = '목표 평단가는 현재 평단가보다 낮아야 합니다.';
                return;
            }

            if (targetPrice <= calcPrice) {
                targetResultDisplay.textContent = '목표 평단가는 계산 기준 가격보다 높아야 합니다.';
                return;
            }

            // ============================================================
            // 필요 수량 계산 (가중 평균 공식)
            // ============================================================
            const requiredQty = (totalBuyQty * (currentAvgBuyPrice - targetPrice)) / (targetPrice - calcPrice);

            if (requiredQty <= 0 || !isFinite(requiredQty)) {
                targetResultDisplay.textContent = '목표 달성이 불가능합니다. 입력 값을 확인해주세요.';
                return;
            }

            // --- Result Display ---
            const requiredAmount = requiredQty * calcPrice;

            targetResultDisplay.innerHTML = `
                🎯 목표 달성: <span class="result-value">${formatCurrencyForDisplay(requiredAmount)} KRW</span><br>
                📊 <span class="result-value">${formatQuantityForDisplay(requiredQty)}</span> BTC 추가 매수 필요
            `;
        }

        // 목표 평단가 자동 계산 (디바운싱)
        if (targetCalculateBtn && targetAvgPriceInput) {
            let targetTimer;

            // 입력 시 자동 계산 (500ms 지연)
            targetAvgPriceInput.addEventListener('input', () => {
                clearTimeout(targetTimer);
                targetTimer = setTimeout(() => {
                    calculateTargetPrice();
                }, 500);
            });

            // 버튼 클릭 시 즉시 계산
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

        /** 현재 모든 데이터를 JSON 파일로 내보냅니다. */
        function exportData() {
            const data = localStorage.getItem('waterDownCalcState');
            if (!data) {
                alert('저장된 데이터가 없습니다.');
                return;
            }
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const date = new Date().toISOString().split('T')[0];
            a.href = url;
            a.download = `water-down-backup-${date}.json`;

            // 앵커 요소를 문서에 임시로 추가 (일부 브라우저 호환성 대응)
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            // 다운로드가 시작될 시간을 벌어주기 위해 지연 후 URL 해제
            setTimeout(() => URL.revokeObjectURL(url), 100);
        }

        /** 파일을 읽어 데이터를 복원합니다. */
        function importData(file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    const parsed = JSON.parse(content);

                    // 최소한의 데이터 형식 검증
                    if (!parsed.version && !parsed.calcMode) {
                        throw new Error('유효한 데이터 형식이 아닙니다.');
                    }

                    if (confirm('현재 모든 데이터가 백업 파일의 데이터로 대체됩니다. 진행하시겠습니까?')) {
                        localStorage.setItem('waterDownCalcState', content);
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
            saveState(); // 복사 전 최신 상태 저장
            const state = localStorage.getItem('waterDownCalcState') || '{}';
            const encodedState = btoa(encodeURIComponent(state));

            // 로컬 파일로 열었을 경우(file://) origin이 "null"이 되는 현상 대응
            let origin = window.location.origin;
            if (origin === 'null' || !origin) {
                // 로컬 환경일 경우 protocol + host를 직접 구성하거나 현재 파일명 활용
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
                localStorage.removeItem('waterDownCalcState');
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
                    stateToLoad = JSON.parse(localStorage.getItem('waterDownCalcState'));
                }
            } else {
                stateToLoad = JSON.parse(localStorage.getItem('waterDownCalcState'));
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
});