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
    // (Currently no JS needed as the price is hardcoded)
    const bitcoinPriceElement = document.getElementById('bitcoin-price');
    if (bitcoinPriceElement && bitcoinPriceElement.textContent === '로딩중...') {
         // This is a fallback in case the hardcoded value is removed
         bitcoinPriceElement.textContent = '업데이트 실패';
    }
});