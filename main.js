window.addEventListener('load', () => {

    const themeToggleBtn = document.getElementById('theme-toggle');
    const generateBtn = document.getElementById('generate-btn');
    const calcDebugLog = document.getElementById('debug-log-calc');

    function logCalc(message) {
        if (calcDebugLog) {
            // Sanitize the message to prevent HTML injection if the error message contains HTML
            const sanitizedMessage = String(message).replace(/</g, "&lt;").replace(/>/g, "&gt;");
            calcDebugLog.innerHTML += sanitizedMessage + '<br>';
        }
        console.log(message);
    }

    // Theme switching logic
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
    async function fetchBitcoinPrice() {
        const bitcoinPriceElement = document.getElementById('bitcoin-price');
        if (!bitcoinPriceElement) return;
        
        logCalc('Attempting to fetch Bitcoin price...');
        try {
            const workerUrl = 'https://upbit-proxy.ooktone.workers.dev/v1/ticker?markets=KRW-BTC';
            logCalc('Worker URL: ' + workerUrl);
            const response = await fetch(workerUrl);
            logCalc('Fetch response received. Status: ' + response.status);

            if (!response.ok) {
                logCalc('Response not OK. Status: ' + response.statusText);
                const errorText = await response.text();
                logCalc('Error details: ' + errorText);
                throw new Error(`API response not OK: ${response.statusText}`);
            }

            const data = await response.json();
            logCalc('Response JSON parsed.');

            if (data && data.length > 0) {
                const price = data[0].trade_price;
                bitcoinPriceElement.textContent = price.toLocaleString() + ' KRW';
                logCalc('Success! Price updated.');
            } else {
                bitcoinPriceElement.textContent = '데이터 없음';
                logCalc('API returned empty data.');
            }
        } catch (error) {
            logCalc('--- CATCH BLOCK ---');
            logCalc('Error Name: ' + error.name);
            logCalc('Error Message: ' + error.message);
            logCalc('Error Stack: ' + error.stack);
            bitcoinPriceElement.textContent = '가격 로드 실패 (오류 발생)';
        }
    }

    if (document.getElementById('bitcoin-price')) {
        fetchBitcoinPrice();
    }
});