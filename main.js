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
    const bitcoinPriceElement = document.getElementById('bitcoin-price');
    if (bitcoinPriceElement) {
        const updateTimerElement = document.getElementById('update-timer');
        const UPDATE_INTERVAL_SECONDS = 5;
        let countdown = UPDATE_INTERVAL_SECONDS;
        let updateInterval;

        async function fetchBitcoinPrice() {
            // Don't fetch if the countdown is not 0, to avoid spamming
            if (countdown > 0 && countdown < UPDATE_INTERVAL_SECONDS) return;

            bitcoinPriceElement.textContent = '업데이트 중...';
            
            try {
                const workerUrl = 'https://upbit-proxy.ooktone.workers.dev/v1/ticker?markets=KRW-BTC';
                const response = await fetch(workerUrl);

                if (!response.ok) {
                    throw new Error(`API response not OK: ${response.statusText}`);
                }

                const data = await response.json();

                if (data && data.length > 0) {
                    const price = data[0].trade_price;
                    bitcoinPriceElement.textContent = price.toLocaleString() + ' KRW';
                } else {
                    throw new Error('API returned empty data.');
                }
            } catch (error) {
                console.error('Error fetching Bitcoin price:', error.message);
                // Keep the last known price on screen, or show a failure message if it's the first load
                if(bitcoinPriceElement.textContent.includes('...')) { // If it's still loading
                    bitcoinPriceElement.textContent = '가격 로드 실패';
                }
            } finally {
                // Always reset the timer after an attempt
                resetAndUpdateTimer();
            }
        }

        function updateTimerDisplay() {
            if (countdown > 0) {
                updateTimerElement.textContent = `(${countdown}초 후 업데이트)`;
            } else {
                updateTimerElement.textContent = `(지금 업데이트!)`;
            }
        }

        function resetAndUpdateTimer() {
            clearInterval(updateInterval); // Clear existing interval
            countdown = UPDATE_INTERVAL_SECONDS; // Reset countdown
            updateTimerDisplay();

            updateInterval = setInterval(() => {
                countdown--;
                if (countdown <= 0) {
                    clearInterval(updateInterval); // Stop this interval
                    fetchBitcoinPrice(); // Fetch price, which will then restart the timer
                } else {
                    updateTimerDisplay();
                }
            }, 1000);
        }

        // Initial fetch and start the timer
        fetchBitcoinPrice();
    }
});