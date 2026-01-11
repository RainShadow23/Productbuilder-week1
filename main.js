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

        if (!lottoNumbersContainer || !historyList) {
            console.error('Error: Lottery container or history list not found!');
            return;
        }

        function generateLottoNumbers() {
            const numbers = [];
            while (numbers.length < 6) {
                const randomNumber = Math.floor(Math.random() * 45) + 1;
                if (!numbers.includes(randomNumber)) {
                    numbers.push(randomNumber);
                }
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
    const calcContainer = document.querySelector('#calculate-btn'); // Use a reliable element to detect the page
    if (calcContainer) {
        // --- Element Hooks ---
        const currentPriceInput = document.getElementById('current-price');
        const calcModeToggle = document.getElementById('calc-mode-toggle');
        const calcModeLabel = document.getElementById('calc-mode-label');
        const initialQtyInput = document.getElementById('initial-qty');
        const initialAvgPriceInput = document.getElementById('initial-avg-price');
        const transactionList = document.getElementById('transaction-list');
        const addTransactionBtn = document.getElementById('add-transaction-btn');
        const calculateBtn = document.getElementById('calculate-btn');
        const resultsContainer = document.getElementById('results-container');
        const transactionRowTemplate = document.getElementById('transaction-row-template');

        // What-if elements
        const whatifAmountInput = document.getElementById('whatif-amount');
        const whatifCalculateBtn = document.getElementById('whatif-calculate-btn');
        const whatifResultDisplay = document.getElementById('whatif-result');

        // Target elements
        const targetAvgPriceInput = document.getElementById('target-avg-price');
        const targetCalculateBtn = document.getElementById('target-calculate-btn');
        const targetResultDisplay = document.getElementById('target-result');
        
        // Result Spans
        const resultTotalQty = document.getElementById('result-total-qty');
        const resultTotalInvestment = document.getElementById('result-total-investment');
        const resultFinalAvgPrice = document.getElementById('result-final-avg-price');
        const resultTotalEvaluation = document.getElementById('result-total-evaluation');
        const resultPnl = document.getElementById('result-pnl');
        const resultReturnRate = document = document.getElementById('result-return-rate');

        // --- State ---
        let calculationMode = 'exchange'; // 'exchange' or 'wallet'

        // --- Persistence (LocalStorage & URL) ---
        function saveState() {
            const state = {
                calcMode: calcModeToggle.checked,
                initialQty: initialQtyInput.value,
                initialAvgPrice: initialAvgPriceInput.value,
                transactions: [],
            };
            document.querySelectorAll('.transaction-row').forEach(row => {
                state.transactions.push({
                    type: row.querySelector('.transaction-type').value,
                    qty: row.querySelector('.transaction-qty').value,
                    price: row.querySelector('.transaction-price').value,
                });
            });
            localStorage.setItem('waterDownCalcState', JSON.stringify(state));
            updateShareLink(state); // Update URL after saving state
        }

        function loadState(state) {
            if (!state) return;

            calcModeToggle.checked = state.calcMode;
            calcModeLabel.textContent = state.calcMode ? '내 지갑 기준' : '거래소 기준';
            calculationMode = state.calcMode ? 'wallet' : 'exchange';

            initialQtyInput.value = state.initialQty;
            initialAvgPriceInput.value = state.initialAvgPrice;

            // Clear existing transactions
            transactionList.innerHTML = ''; 
            state.transactions.forEach(tx => {
                const newRow = transactionRowTemplate.content.cloneNode(true);
                newRow.querySelector('.transaction-type').value = tx.type;
                newRow.querySelector('.transaction-qty').value = tx.qty;
                newRow.querySelector('.transaction-price').value = tx.price;
                transactionList.appendChild(newRow);
                attachRemoveListener(transactionList.lastElementChild.querySelector('.remove-transaction-btn'));
            });
        }

        function updateShareLink(state) {
            const encodedState = btoa(encodeURIComponent(JSON.stringify(state)));
            const newUrl = `${window.location.origin}${window.location.pathname}?data=${encodedState}`;
            // Optional: display this link somewhere or add a button to copy it.
            // For now, we'll just update the URL without pushing to history for cleaner UX
            // history.replaceState(null, '', newUrl); // Not replacing history for now
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
                    currentPriceInput.value = price.toLocaleString();
                } else {
                    throw new Error('API returned empty data.');
                }
            } catch (error) {
                console.error('Error fetching Bitcoin price:', error.message);
                if(window.location.hostname === 'localhost' || window.location.protocol === 'file:') {
                    currentPriceInput.placeholder = '미리보기에서는 실시간 가격을 표시할 수 없습니다.';
                } else {
                    currentPriceInput.placeholder = '가격 로드 실패';
                }
            }
        }
        fetchBitcoinPrice();

        // --- Calculation Logic ---
        function calculate() {
            let totalQty = parseFloat(initialQtyInput.value) || 0;
            let totalCost = totalQty * (parseFloat(initialAvgPriceInput.value) || 0);

            const transactions = document.querySelectorAll('.transaction-row');

            if (calculationMode === 'exchange') {
                let totalBuyQty = parseFloat(initialQtyInput.value) || 0;
                let totalBuyCost = totalBuyQty * (parseFloat(initialAvgPriceInput.value) || 0);
                let totalSellQty = 0;

                transactions.forEach(row => {
                    const type = row.querySelector('.transaction-type').value;
                    const qty = parseFloat(row.querySelector('.transaction-qty').value) || 0;
                    const price = parseFloat(row.querySelector('.transaction-price').value) || 0;

                    if (qty > 0 && price >= 0) { 
                         if (type === 'buy') {
                            totalBuyQty += qty;
                            totalBuyCost += qty * price;
                        } else { // sell
                            totalSellQty += qty;
                        }
                    }
                });

                const finalAvgBuyPrice = (totalBuyQty > 0) ? totalBuyCost / totalBuyQty : 0;
                totalQty = totalBuyQty - totalSellQty;
                totalCost = totalQty * finalAvgBuyPrice; // The cost basis of remaining assets

            } else { // wallet mode
                // Apply initial holdings to wallet mode calculation if they exist
                if (initialQtyInput.value && initialAvgPriceInput.value) {
                    // Already included above
                }

                transactions.forEach(row => {
                    const type = row.querySelector('.transaction-type').value;
                    const qty = parseFloat(row.querySelector('.transaction-qty').value) || 0;
                    const price = parseFloat(row.querySelector('.transaction-price').value) || 0;
                    
                    if (qty > 0 && price >= 0) { // price can be 0 for airdrops
                        if (type === 'buy') {
                            totalCost += qty * price;
                            totalQty += qty;
                        } else { // sell
                            if (totalQty > 0) {
                                const avgPriceBeforeSell = totalCost / totalQty;
                                const profit = (price - avgPriceBeforeSell) * qty; // Profit for the sold quantity
                                totalCost -= profit; // Subtract realized profit from total cost basis
                                totalQty -= qty;
                                // Prevent negative quantity if selling more than held
                                if (totalQty < 0) totalQty = 0;
                            } else {
                                // If trying to sell when totalQty is 0, handle or ignore
                                console.warn("Attempted to sell when no quantity was held.");
                            }
                        }
                    }
                });
            }
            
            // Format results
            const finalAvgPrice = (totalQty > 0) ? totalCost / totalQty : 0;
            const currentPrice = parseFloat(currentPriceInput.value.replace(/,/g, '')) || 0;
            const totalEvaluation = totalQty * currentPrice;
            const pnl = totalEvaluation - totalCost;
            const returnRate = (totalCost > 0) ? (pnl / totalCost) * 100 : 0;

            resultTotalQty.textContent = totalQty.toLocaleString(undefined, { maximumFractionDigits: 8 });
            resultTotalInvestment.textContent = Math.round(totalCost).toLocaleString() + ' KRW';
            resultFinalAvgPrice.textContent = Math.round(finalAvgPrice).toLocaleString() + ' KRW';
            resultTotalEvaluation.textContent = Math.round(totalEvaluation).toLocaleString() + ' KRW';
            resultPnl.textContent = Math.round(pnl).toLocaleString() + ' KRW';
            resultReturnRate.textContent = returnRate.toFixed(2) + ' %';
            
            resultsContainer.style.display = 'block';
            saveState(); // Save state after calculation
        }

        // --- What-if Calculation ---
        whatifCalculateBtn.addEventListener('click', () => {
            const amount = parseFloat(whatifAmountInput.value) || 0;
            if (amount <= 0) {
                whatifResultDisplay.textContent = '유효한 금액을 입력하세요.';
                return;
            }

            let currentTotalQty = 0;
            let currentTotalCost = 0;

            // Recalculate current state based on inputs
            const tempTransactions = Array.from(document.querySelectorAll('.transaction-row')).map(row => ({
                type: row.querySelector('.transaction-type').value,
                qty: parseFloat(row.querySelector('.transaction-qty').value) || 0,
                price: parseFloat(row.querySelector('.transaction-price').value) || 0
            }));

            // Initial holdings
            currentTotalQty = parseFloat(initialQtyInput.value) || 0;
            currentTotalCost = currentTotalQty * (parseFloat(initialAvgPriceInput.value) || 0);

            // Apply all existing buys
            tempTransactions.forEach(tx => {
                if (tx.type === 'buy') {
                    currentTotalQty += tx.qty;
                    currentTotalCost += tx.qty * tx.price;
                }
            });

            // Apply sell logic (only affects what's available for future buy)
            let tempFinalQtyAfterSells = currentTotalQty;
            tempTransactions.forEach(tx => {
                if (tx.type === 'sell') {
                    tempFinalQtyAfterSells -= tx.qty;
                }
            });
            if (tempFinalQtyAfterSells < 0) tempFinalQtyAfterSells = 0;


            // What-if logic
            const currentPrice = parseFloat(currentPriceInput.value.replace(/,/g, '')) || 0;
            if (currentPrice <= 0) {
                whatifResultDisplay.textContent = '현재 시세를 입력하거나 로드하세요.';
                return;
            }

            const additionalQty = amount / currentPrice;
            const newTotalQty = tempFinalQtyAfterSells + additionalQty;
            const newTotalCost = currentTotalCost + amount; // Assuming cost basis of buys + new amount

            const newAvgPrice = (newTotalQty > 0) ? newTotalCost / newTotalQty : 0;
            
            whatifResultDisplay.textContent = `추가 매수 시 최종 평단가: ${Math.round(newAvgPrice).toLocaleString()} KRW, 총 수량: ${newTotalQty.toLocaleString(undefined, { maximumFractionDigits: 8 })} BTC`;
        });

        // --- Target Price Calculation ---
        targetCalculateBtn.addEventListener('click', () => {
            const targetPrice = parseFloat(targetAvgPriceInput.value) || 0;
            if (targetPrice <= 0) {
                targetResultDisplay.textContent = '유효한 목표 평단가를 입력하세요.';
                return;
            }

            let currentTotalQty = 0;
            let currentTotalCost = 0;

            // Recalculate current state based on inputs
            const tempTransactions = Array.from(document.querySelectorAll('.transaction-row')).map(row => ({
                type: row.querySelector('.transaction-type').value,
                qty: parseFloat(row.querySelector('.transaction-qty').value) || 0,
                price: parseFloat(row.querySelector('.transaction-price').value) || 0
            }));

            // Initial holdings
            currentTotalQty = parseFloat(initialQtyInput.value) || 0;
            currentTotalCost = currentTotalQty * (parseFloat(initialAvgPriceInput.value) || 0);

            // Apply all existing buys
            tempTransactions.forEach(tx => {
                if (tx.type === 'buy') {
                    currentTotalQty += tx.qty;
                    currentTotalCost += tx.qty * tx.price;
                }
            });

            // Apply sell logic (only affects what's available for future buy)
            let tempFinalQtyAfterSells = currentTotalQty;
            tempTransactions.forEach(tx => {
                if (tx.type === 'sell') {
                    tempFinalQtyAfterSells -= tx.qty;
                }
            });
            if (tempFinalQtyAfterSells < 0) tempFinalQtyAfterSells = 0;


            const currentPrice = parseFloat(currentPriceInput.value.replace(/,/g, '')) || 0;
            if (currentPrice <= 0) {
                targetResultDisplay.textContent = '현재 시세를 입력하거나 로드하세요.';
                return;
            }

            if (targetPrice >= currentTotalCost / currentTotalQty && currentTotalQty > 0) {
                 targetResultDisplay.textContent = '목표 평단가는 현재 평단가보다 낮아야 합니다.';
                 return;
            }
            if (targetPrice >= currentPrice) {
                targetResultDisplay.textContent = '목표 평단가는 현재 시세보다 낮아야 합니다.';
                return;
            }
            

            // Formula: X = Q_current * (P_avg_current - P_target) / (P_target - P_current_market)
            const requiredQty = (tempFinalQtyAfterSells * ((currentTotalCost / currentTotalQty) - targetPrice)) / (targetPrice - currentPrice);

            if (requiredQty <= 0 || isNaN(requiredQty) || !isFinite(requiredQty)) {
                targetResultDisplay.textContent = '현재 조건으로는 목표 달성이 어렵습니다. 목표 평단가를 조정하거나 현재 시세를 확인하세요.';
                return;
            }

            const requiredAmount = requiredQty * currentPrice;

            targetResultDisplay.textContent = `목표 평단가 달성을 위해 약 ${requiredQty.toLocaleString(undefined, { maximumFractionDigits: 8 })} BTC를 ${Math.round(requiredAmount).toLocaleString()} KRW에 추가 매수해야 합니다.`;
        });


        // --- Event Listeners (for form elements that trigger state save) ---
        // Debounce for input fields to avoid saving too frequently
        let saveTimer;
        const debouncedSaveState = () => {
            clearTimeout(saveTimer);
            saveTimer = setTimeout(saveState, 500); // Save state 500ms after last input
        };

        initialQtyInput.addEventListener('input', debouncedSaveState);
        initialAvgPriceInput.addEventListener('input', debouncedSaveState);
        transactionList.addEventListener('input', debouncedSaveState); // Event delegation for dynamic inputs
        currentPriceInput.addEventListener('input', debouncedSaveState);
        calcModeToggle.addEventListener('change', saveState); // Mode change saves immediately

        // --- Initial Load ---
        const urlParams = new URLSearchParams(window.location.search);
        const encodedState = urlParams.get('data');

        if (encodedState) {
            try {
                const decodedState = JSON.parse(decodeURIComponent(atob(encodedState)));
                loadState(decodedState);
                console.log('State loaded from URL.');
            } catch (e) {
                console.error('Error loading state from URL:', e);
                loadState(JSON.parse(localStorage.getItem('waterDownCalcState'))); // Fallback to local storage
            }
        } else {
            loadState(JSON.parse(localStorage.getItem('waterDownCalcState')));
            console.log('State loaded from Local Storage.');
        }

        // --- Share Link Button (Placeholder for now, assuming user wants to add later) ---
        // For now, saveState() calls updateShareLink() internally.
    }
});