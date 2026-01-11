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
            updateMode(); // Update label and state variable
            initialQtyInput.value = state.initialQty;
            initialAvgPriceInput.value = state.initialAvgPrice;
            transactionList.innerHTML = '';
            state.transactions.forEach(addTransactionRow);
        }

        // --- UI Functions ---
        function addTransactionRow(tx) {
            const newRow = transactionRowTemplate.content.cloneNode(true);
            if (tx) { // If loading from state
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
            currentPriceInput.placeholder = '업데이트 중...';
            try {
                const workerUrl = 'https://upbit-proxy.ooktone.workers.dev/v1/ticker?markets=KRW-BTC';
                const response = await fetch(workerUrl);
                if (!response.ok) throw new Error('API response not OK');
                const data = await response.json();
                if (data && data.length > 0) {
                    const price = data[0].trade_price;
                    currentPriceInput.value = price;
                    calculationPriceInput.value = price; // Also update the calculation price
                } else {
                    throw new Error('API returned empty data.');
                }
            } catch (error) {
                console.error('Error fetching Bitcoin price:', error.message);
                currentPriceInput.placeholder = '가격 로드 실패';
            }
        }
        
        // --- Core Calculation ---
        function calculate() {
            let initialQty = parseFloat(initialQtyInput.value) || 0;
            let initialCost = initialQty * (parseFloat(initialAvgPriceInput.value) || 0);

            const transactions = Array.from(document.querySelectorAll('.transaction-row')).map(row => ({
                type: row.querySelector('.transaction-type').value,
                qty: parseFloat(row.querySelector('.transaction-qty').value) || 0,
                price: parseFloat(row.querySelector('.transaction-price').value) || 0,
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
            const currentPrice = parseFloat(currentPriceInput.value.replace(/,/g, '')) || 0;
            const totalEvaluation = finalQty * currentPrice;
            const pnl = totalEvaluation - finalCost;
            const returnRate = (finalCost > 0) ? (pnl / finalCost) * 100 : 0;
            
            resultSpans.totalQty.textContent = finalQty.toLocaleString(undefined, { maximumFractionDigits: 8 });
            resultSpans.totalInvestment.textContent = Math.round(finalCost).toLocaleString() + ' KRW';
            resultSpans.finalAvgPrice.textContent = Math.round(finalAvgPrice).toLocaleString() + ' KRW';
            resultSpans.totalEvaluation.textContent = Math.round(totalEvaluation).toLocaleString() + ' KRW';
            resultSpans.pnl.textContent = Math.round(pnl).toLocaleString() + ' KRW';
            resultSpans.returnRate.textContent = returnRate.toFixed(2) + ' %';
            
            resultsContainer.style.display = 'block';
            saveState();
        }
        
        // --- Helper Calculations ---
        function getPreCalculationState() {
             let totalBuyQty = parseFloat(initialQtyInput.value) || 0;
             let totalBuyCost = totalBuyQty * (parseFloat(initialAvgPriceInput.value) || 0);
             let totalSellQty = 0;

             document.querySelectorAll('.transaction-row').forEach(row => {
                 const type = row.querySelector('.transaction-type').value;
                 const qty = parseFloat(row.querySelector('.transaction-qty').value) || 0;
                 const price = parseFloat(row.querySelector('.transaction-price').value) || 0;
                 if (qty > 0 && price >= 0) {
                      if (type === 'buy') {
                         totalBuyQty += qty;
                         totalBuyCost += qty * price;
                     } else {
                         totalSellQty += qty;
                     }
                 }
             });
             return { totalBuyQty, totalBuyCost, totalSellQty };
        }

        whatifCalculateBtn.addEventListener('click', () => {
            const amount = parseFloat(whatifAmountInput.value) || 0;
            const calcPrice = parseFloat(calculationPriceInput.value.replace(/,/g, '')) || parseFloat(currentPriceInput.value.replace(/,/g, '')) || 0;
            if (amount <= 0 || calcPrice <= 0) {
                whatifResultDisplay.textContent = '유효한 금액과 계산 기준 가격을 입력하세요.';
                return;
            }

            const { totalBuyQty, totalBuyCost, totalSellQty } = getPreCalculationState();
            const currentAvgBuyPrice = (totalBuyQty > 0) ? totalBuyCost / totalBuyQty : 0;

            const additionalQty = amount / calcPrice;
            const newTotalBuyQty = totalBuyQty + additionalQty;
            const newTotalBuyCost = totalBuyCost + amount;
            
            const newAvgPrice = (newTotalBuyQty > 0) ? newTotalBuyCost / newTotalBuyQty : 0;
            const newFinalQty = newTotalBuyQty - totalSellQty;
            
            whatifResultDisplay.textContent = `예상 평단가: ${Math.round(newAvgPrice).toLocaleString()} KRW, 총 보유량: ${newFinalQty.toLocaleString(undefined, { maximumFractionDigits: 8 })} BTC`;
        });

        targetCalculateBtn.addEventListener('click', () => {
            const targetPrice = parseFloat(targetAvgPriceInput.value) || 0;
            const calcPrice = parseFloat(calculationPriceInput.value.replace(/,/g, '')) || parseFloat(currentPriceInput.value.replace(/,/g, '')) || 0;
            if (targetPrice <= 0 || calcPrice <= 0) {
                targetResultDisplay.textContent = '유효한 목표 평단가와 계산 기준 가격을 입력하세요.';
                return;
            }

            const { totalBuyQty, totalBuyCost } = getPreCalculationState();
            const currentAvgBuyPrice = (totalBuyQty > 0) ? totalBuyCost / totalBuyQty : 0;

            if (targetPrice >= currentAvgBuyPrice) {
                 targetResultDisplay.textContent = '목표는 현재 평단가보다 낮아야 합니다.';
                 return;
            }
            if (targetPrice <= calcPrice) {
                targetResultDisplay.textContent = '목표는 계산 기준 가격보다 높아야 합니다.';
                return;
            }

            // Formula: X = Q_buy * (P_avg_buy - P_target) / (P_target - P_calc)
            const requiredQty = (totalBuyQty * (currentAvgBuyPrice - targetPrice)) / (targetPrice - calcPrice);

            if (requiredQty <= 0 || !isFinite(requiredQty)) {
                targetResultDisplay.textContent = '목표 달성이 불가능합니다.';
                return;
            }
            const requiredAmount = requiredQty * calcPrice;
            targetResultDisplay.textContent = `약 ${requiredQty.toLocaleString(undefined, { maximumFractionDigits: 8 })} BTC (${Math.round(requiredAmount).toLocaleString()} KRW) 추가 매수 필요`;
        });

        // --- Event Listeners ---
        let saveTimer;
        const debouncedSaveState = () => { clearTimeout(saveTimer); saveTimer = setTimeout(saveState, 500); };
        
        [initialQtyInput, initialAvgPriceInput, currentPriceInput].forEach(el => el.addEventListener('input', debouncedSaveState));
        transactionList.addEventListener('input', debouncedSaveState);
        calcModeToggle.addEventListener('change', () => { updateMode(); saveState(); });
        addTransactionBtn.addEventListener('click', () => addTransactionRow());
        calculateBtn.addEventListener('click', calculate);

        shareBtn.addEventListener('click', () => {
            const state = JSON.parse(localStorage.getItem('waterDownCalcState') || '{}');
            const encodedState = btoa(encodeURIComponent(JSON.stringify(state)));
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
                window.location.href = window.location.pathname; // Reload without query params
            }
        });

        // --- Initial Load ---
        const urlParams = new URLSearchParams(window.location.search);
        const encodedData = urlParams.get('data');
        if (encodedData) {
            try {
                const decodedState = JSON.parse(decodeURIComponent(atob(encodedData)));
                loadState(decodedState);
            } catch (e) {
                console.error('Error loading state from URL, falling back to localStorage:', e);
                loadState(JSON.parse(localStorage.getItem('waterDownCalcState')));
            }
        } else {
            loadState(JSON.parse(localStorage.getItem('waterDownCalcState')));
        }
    }
});
