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

        // --- Persistence ---
        function saveState() {
            const state = {
                calcMode: calcModeToggle.checked,
                initialQty: initialQtyInput.value,
                initialAvgPrice: initialAvgPriceInput.value,
                transactions: Array.from(document.querySelectorAll('.transaction-row')).map(row => ({
                    type: row.querySelector('.transaction-type').value,
                    qty: row.querySelector('.transaction-qty').value,
                    price: row.querySelector('.transaction-price').value,
                })),
            };
            localStorage.setItem('waterDownCalcState', JSON.stringify(state));
        }

        function loadState(state) {
            if (!state) return;
            calcModeToggle.checked = state.calcMode;
            updateMode();
            initialQtyInput.value = state.initialQty;
            initialAvgPriceInput.value = state.initialAvgPrice;
            transactionList.innerHTML = '';
            if (state.transactions) {
                state.transactions.forEach(addTransactionRow);
            }
        }

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
        async function fetchBitcoinPrice() {
            try {
                const workerUrl = 'https://upbit-proxy.ooktone.workers.dev/v1/ticker?markets=KRW-BTC';
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
                console.error('Error fetching Bitcoin price:', error.message);
                // Set the value, not placeholder, to show the error
                if (!currentPriceInput.value) {
                    currentPriceInput.value = '가격 로드 실패';
                }
            }
        }
        
        const safeParseFloat = (str) => parseFloat(String(str).replace(/,/g, '')) || 0;

        // --- UI Formatting Helper Functions ---
        const parseFormattedNumber = (str) => parseFloat(String(str || '').replace(/,/g, '')) || 0;

        const formatNumberWithCommas = (num) => {
             if (typeof num !== 'number' && typeof num !== 'string') return '';
            const parts = String(num).split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            return parts.join('.');
        };
        
        const formatCurrencyForDisplay = (num) => {
            if (typeof num !== 'number' || !isFinite(num)) return '-';
            const roundedNum = Math.round(num);
            return `<span class="int-part">${formatNumberWithCommas(roundedNum)}</span>`;
        };

        const formatQuantityForDisplay = (num) => {
            if (typeof num !== 'number' || !isFinite(num)) return '-';
            const fixedNum = num.toFixed(8); // Handle potential floating point issues and set max precision
            const [intPart, decPart] = fixedNum.split('.');
            // Don't show .00000000 for integers
            if (parseInt(decPart, 10) === 0) {
                return `<span class="int-part">${formatNumberWithCommas(intPart)}</span>`;
            }
            const trimmedDecPart = decPart.replace(/0+$/, ''); // Trim trailing zeros
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

        // --- Core Calculation ---
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

            } else { // wallet mode
                transactions.forEach(tx => {
                    if (tx.qty > 0 && tx.price >= 0) {
                        if (tx.type === 'buy') {
                            finalCost += tx.qty * tx.price;
                            finalQty += tx.qty;
                        } else {
                            if (finalQty > 0) {
                                const avgPriceBeforeSell = finalCost / finalQty;
                                const profit = (tx.price - avgPriceBeforeSell) * Math.min(tx.qty, finalQty);
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
        
        // --- Helper Calculations ---
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

                        if (whatifCalculateBtn) {

                            whatifCalculateBtn.addEventListener('click', () => {

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

                                

                                const avgPriceChangeRate = ((newAvgPrice / currentAvgBuyPrice) - 1) * 100;

                                

                                const rateClass = avgPriceChangeRate < 0 ? 'loss' : (avgPriceChangeRate > 0 ? 'profit' : '');

                                const rateSign = avgPriceChangeRate > 0 ? '+' : '';

                

                                whatifResultDisplay.innerHTML = `

                                    예상 평단가: <span class="result-value">${formatCurrencyForDisplay(newAvgPrice)} KRW</span>

                                    <span class="pnl-rate ${rateClass}">(${rateSign}${avgPriceChangeRate.toFixed(2)}%)</span>

                                `;

                            });

                        }

        

                if (targetCalculateBtn) {

                    targetCalculateBtn.addEventListener('click', () => {

                        const targetPrice = safeParseFloat(targetAvgPriceInput.value);

                        const calcPrice = safeParseFloat(calculationPriceInput.value);

                        if (targetPrice <= 0 || calcPrice <= 0) {

                            targetResultDisplay.textContent = '유효한 목표 평단가와 계산 기준 가격을 입력하세요.';

                            return;

                        }

        

                        const { totalBuyQty, totalBuyCost } = getPreCalculationState();

                        const currentAvgBuyPrice = (totalBuyQty > 0) ? totalBuyCost / totalBuyQty : 0;

        

                        // --- Pre-calculation Validation ---

        

                        // Case 1: No current holdings.

                        if (currentAvgBuyPrice === 0) {

                            targetResultDisplay.textContent = '보유 수량이 없어 평단가를 계산할 수 없습니다. 기본 정보를 먼저 입력하세요.';

                            return;

                        }

        

                        // Case 2: Impossible to "water down" (average down).

                        // This happens if the current average price is already at or below the price of a new purchase.

                        // You can't lower your average by buying at a higher price.

                        if (currentAvgBuyPrice <= calcPrice) {

                            targetResultDisplay.textContent = `현재 평단가(${Math.round(currentAvgBuyPrice).toLocaleString()}원)가 계산 기준 가격(${calcPrice.toLocaleString()}원)보다 낮거나 같아 평단가를 더 낮출 수 없습니다.`;

                            return;

                        }

        

                        // Case 3: Target price is not logically possible.

                        // It must be between the (lower) calculation price and the (higher) current average price.

                        if (targetPrice >= currentAvgBuyPrice) {

                            targetResultDisplay.textContent = '목표 평단가는 현재 평단가보다 낮아야 합니다.';

                            return;

                        }

                        if (targetPrice <= calcPrice) {

                            targetResultDisplay.textContent = '목표 평단가는 계산 기준 가격보다 높아야 합니다.';

                            return;

                        }

        

                        // --- Calculation ---

                        // This formula is correct based on the logic of weighted averages.

                        const requiredQty = (totalBuyQty * (currentAvgBuyPrice - targetPrice)) / (targetPrice - calcPrice);

        

                        if (requiredQty <= 0 || !isFinite(requiredQty)) {

                            targetResultDisplay.textContent = '목표 달성이 불가능합니다. 입력 값을 확인해주세요.';

                            return;

                        }

        

                        // --- Result Display ---

                                    const requiredAmount = requiredQty * calcPrice;

                                    targetResultDisplay.innerHTML = `약 <span class="result-value">${formatCurrencyForDisplay(requiredAmount)} KRW</span> (<span class="result-value">${formatQuantityForDisplay(requiredQty)}</span> BTC) 추가 매수 필요`;

                    });

                }

        // --- Event Listeners ---
        let saveTimer;
        const debouncedSaveState = () => { clearTimeout(saveTimer); saveTimer = setTimeout(saveState, 500); };
        
        [initialQtyInput, initialAvgPriceInput, currentPriceInput, calculationPriceInput].forEach(el => el.addEventListener('input', debouncedSaveState));
        transactionList.addEventListener('input', debouncedSaveState);
        calcModeToggle.addEventListener('change', () => { updateMode(); saveState(); });
        addTransactionBtn.addEventListener('click', () => addTransactionRow());
        calculateBtn.addEventListener('click', calculate);

        shareBtn.addEventListener('click', () => {
            saveState(); // Ensure state is fresh before copying
            const state = localStorage.getItem('waterDownCalcState') || '{}';
            const encodedState = btoa(encodeURIComponent(state));
            const url = `${window.location.origin}${window.location.pathname}?data=${encodedState}`;
            navigator.clipboard.writeText(url).then(() => {
                alert('공유 링크가 클립보드에 복사되었습니다!');
            }, () => {
                alert('링크 복사에 실패했습니다.');
            });
        });
        
        resetBtn.addEventListener('click', () => {
            if(confirm('정말 모든 데이터를 초기화하시겠습니까?')) {
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
            
            fetchBitcoinPrice(); // Fetch price on initial load
            priceUpdateInterval = setInterval(fetchBitcoinPrice, 30000); // Auto-refresh every 30 seconds
        }
        
        initialize();
    }
});