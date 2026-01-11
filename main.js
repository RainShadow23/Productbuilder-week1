const numberSpans = document.querySelectorAll('.number');
const generateBtn = document.getElementById('generate-btn');
const historyList = document.getElementById('history-list');
const themeToggleBtn = document.getElementById('theme-toggle');

// Theme switching logic
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


    // Upbit API integration for Water Down Calculator
    async function fetchBitcoinPrice() {
        const bitcoinPriceElement = document.getElementById('bitcoin-price');
        if (!bitcoinPriceElement) return;

        try {
            const response = await fetch('https://proxy.cors.sh/https://api.upbit.com/v1/ticker?markets=KRW-BTC', {
                headers: {
                    'x-cors-api-key': 'temp_1a2b3c4d5e6f7g8h9i0j'
                }
            });
            console.log('Response:', response);
            if (!response.ok) {
                console.error('Response not OK:', response.status, response.statusText);
                const text = await response.text();
                console.error('Response text:', text);
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            if (data && data.length > 0) {
                const price = data[0].trade_price;
                bitcoinPriceElement.textContent = price.toLocaleString();
                console.log('Current Bitcoin Price (KRW-BTC):', price);
            } else {
                bitcoinPriceElement.textContent = 'N/A';
                console.log('Could not fetch Bitcoin price. Data is empty.');
                console.log('Received data:', data);
            }
        } catch (error) {
            bitcoinPriceElement.textContent = 'Error';
            console.error('Error fetching Bitcoin price:', error);
        }
    }

    // Check current page and call relevant functions
    if (window.location.pathname.includes('water_down_calculator.html')) {
        fetchBitcoinPrice();
    } else if (window.location.pathname.includes('lottery.html')) {
        // Lotto Number Generator specific logic (already present)
        // Ensure elements exist before adding event listeners
        if (generateBtn) {
            generateBtn.addEventListener('click', generateLottoNumbers);
        }
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
        if (!lottoNumbersContainer) return; // Defensive check
        lottoNumbersContainer.innerHTML = '';
        numbers.forEach(num => {
            const span = document.createElement('span');
            span.className = 'number';
            span.textContent = num;
            lottoNumbersContainer.appendChild(span);
        });
    }

    function addToHistory(numbers) {
        if (!historyList) return; // Defensive check
        const listItem = document.createElement('li');
        listItem.textContent = numbers.join(', ');
        historyList.prepend(listItem); // Add to the top
    }

    // Initial generation on page load (optional)
    // generateLottoNumbers();
});