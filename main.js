window.addEventListener('load', () => {

    const themeToggleBtn = document.getElementById('theme-toggle');
    const generateBtn = document.getElementById('generate-btn');

    // Theme switching logic (applies to all pages with the button)
    if (themeToggleBtn) {
        const currentTheme = localStorage.getItem('theme');
        if (currentTheme === 'dark') {
            document.body.classList.add('dark');
        }

        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark');
            let theme = 'light';
            if (document.body.classList.contains('dark')) {
                theme = 'dark';
            }
            localStorage.setItem('theme', theme);
        });
    }

    // --- Lotto Number Generator Logic ---
    // We trigger this logic if the 'generate-btn' exists on the page.
    if (generateBtn) {
        const lottoNumbersContainer = document.querySelector('.lotto-numbers');
        const historyList = document.getElementById('history-list');

        if (!lottoNumbersContainer || !historyList) {
            console.error('Error: Lottery container or history list not found!');
            return; // Stop execution if essential elements are missing
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

        // Initial generation on page load
        generateLottoNumbers();
    }

    // --- Water Down Calculator Logic ---
    async function fetchBitcoinPrice() {
        const bitcoinPriceElement = document.getElementById('bitcoin-price');
        if (!bitcoinPriceElement) return;

        try {
            // Use the deployed Cloudflare Worker URL
            const response = await fetch('https://upbit-proxy.ooktone.workers.dev/v1/ticker?markets=KRW-BTC');
            
            if (!response.ok) {
                // If the response is not OK, log error and throw
                console.error('API Response not OK:', response.status, response.statusText);
                const errorText = await response.text();
                console.error('API Error details:', errorText);
                throw new Error(`Failed to fetch Bitcoin price: ${response.statusText}`);
            }

            const data = await response.json();
            if (data && data.length > 0) {
                const price = data[0].trade_price;
                bitcoinPriceElement.textContent = price.toLocaleString() + ' KRW';
                console.log('Current Bitcoin Price (KRW-BTC) via Worker:', price);
            } else {
                bitcoinPriceElement.textContent = '데이터 없음';
                console.log('Could not fetch Bitcoin price. Data is empty.');
            }
        } catch (error) {
            console.error('Error fetching Bitcoin price via Worker:', error);
            // Graceful handling for preview environment or other failures
            if (window.location.hostname === 'localhost' || window.location.protocol === 'file:') { // Assuming preview runs on localhost or file protocol
                bitcoinPriceElement.textContent = '미리보기에서는 실시간 가격을 표시할 수 없습니다.';
            } else {
                bitcoinPriceElement.textContent = '가격 로드 실패';
            }
        }
    }

    // Call the function if we are on the water_down_calculator.html page
    if (window.location.pathname.includes('water_down_calculator.html')) {
        fetchBitcoinPrice();
    }
});