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
        // ... (lotto logic remains the same)
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
        
        // Result Spans
        const resultTotalQty = document.getElementById('result-total-qty');
        const resultTotalInvestment = document.getElementById('result-total-investment');
        const resultFinalAvgPrice = document.getElementById('result-final-avg-price');
        const resultTotalEvaluation = document.getElementById('result-total-evaluation');
        const resultPnl = document.getElementById('result-pnl');
        const resultReturnRate = document.getElementById('result-return-rate');

        // --- State ---
        let calculationMode = 'exchange'; // 'exchange' or 'wallet'

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
                } else {
                    throw new Error('API returned empty data.');
                }
            } catch (error) {
                console.error('Error fetching Bitcoin price:', error.message);
                currentPriceInput.placeholder = '가격 로드 실패';
            }
        }
        fetchBitcoinPrice();

        // --- Event Listeners ---
        calcModeToggle.addEventListener('change', () => {
            if (calcModeToggle.checked) {
                calculationMode = 'wallet';
                calcModeLabel.textContent = '내 지갑 기준';
            } else {
                calculationMode = 'exchange';
                calcModeLabel.textContent = '거래소 기준';
            }
        });

        addTransactionBtn.addEventListener('click', () => {
            const template = document.getElementById('transaction-row-template');
            const newRow = template.content.cloneNode(true);
            transactionList.appendChild(newRow);
            // Add listener to the new remove button
            transactionList.lastElementChild.querySelector('.remove-transaction-btn').addEventListener('click', (e) => {
                e.target.closest('.transaction-row').remove();
            });
        });

        calculateBtn.addEventListener('click', () => {
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

                    if (qty > 0 && price >= 0) { // price can be 0 for airdrops etc.
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
                transactions.forEach(row => {
                    const type = row.querySelector('.transaction-type').value;
                    const qty = parseFloat(row.querySelector('.transaction-qty').value) || 0;
                    const price = parseFloat(row.querySelector('.transaction-price').value) || 0;
                    
                    if (qty > 0 && price > 0) {
                        if (type === 'buy') {
                            totalCost += qty * price;
                            totalQty += qty;
                        } else { // sell
                            if (totalQty > 0) {
                                const avgPriceBeforeSell = totalCost / totalQty;
                                const profit = (price - avgPriceBeforeSell) * Math.min(qty, totalQty);
                                totalCost -= profit; // Subtract realized profit from total cost basis
                                totalQty -= qty;
                            }
                        }
                    }
                });
            }

            const finalAvgPrice = (totalQty > 0) ? totalCost / totalQty : 0;
            const currentPrice = parseFloat(currentPriceInput.value.replace(/,/g, '')) || 0;
            const totalEvaluation = totalQty * currentPrice;
            const pnl = totalEvaluation - totalCost;
            const returnRate = (totalCost > 0) ? (pnl / totalCost) * 100 : 0;

            // Display Results
            resultTotalQty.textContent = totalQty.toLocaleString();
            resultTotalInvestment.textContent = Math.round(totalCost).toLocaleString() + ' KRW';
            resultFinalAvgPrice.textContent = Math.round(finalAvgPrice).toLocaleString() + ' KRW';
            resultTotalEvaluation.textContent = Math.round(totalEvaluation).toLocaleString() + ' KRW';
            resultPnl.textContent = Math.round(pnl).toLocaleString() + ' KRW';
            resultReturnRate.textContent = returnRate.toFixed(2) + ' %';
            
            resultsContainer.style.display = 'block';
        });
    }
});