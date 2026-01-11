window.addEventListener('load', () => {

    const themeToggleBtn = document.getElementById('theme-toggle');
    const generateBtn = document.getElementById('generate-btn');
    const debugLog = document.getElementById('debug-log');

    function log(message) {
        if (debugLog) {
            debugLog.innerHTML += message + '<br>';
        }
        console.log(message);
    }

    log('Window fully loaded.');

    // Theme switching logic (applies to all pages with the button)
    if (themeToggleBtn) {
        log('Theme toggle button found.');
        const currentTheme = localStorage.getItem('theme');
        if (currentTheme === 'dark') {
            document.body.classList.add('dark');
            log('Dark theme applied from localStorage.');
        }

        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark');
            let theme = 'light';
            if (document.body.classList.contains('dark')) {
                theme = 'dark';
            }
            localStorage.setItem('theme', theme);
            log('Theme changed to ' + theme);
        });
    }

    // --- Lotto Number Generator Logic ---
    // We trigger this logic if the 'generate-btn' exists on the page.
    if (generateBtn) {
        log('Lottery page detected (found generate-btn).');

        const lottoNumbersContainer = document.querySelector('.lotto-numbers');
        const historyList = document.getElementById('history-list');

        if (!lottoNumbersContainer || !historyList) {
            log('Error: Lottery container or history list not found!');
            return; // Stop execution if essential elements are missing
        }
        log('Lottery elements found.');

        function generateLottoNumbers() {
            log('Generating numbers...');
            const numbers = [];
            while (numbers.length < 6) {
                const randomNumber = Math.floor(Math.random() * 45) + 1;
                if (!numbers.includes(randomNumber)) {
                    numbers.push(randomNumber);
                }
            }
            numbers.sort((a, b) => a - b);
            log('Numbers generated: ' + numbers.join(', '));
            displayNumbers(numbers);
            addToHistory(numbers);
        }

        function displayNumbers(numbers) {
            log('Displaying numbers.');
            lottoNumbersContainer.innerHTML = '';
            numbers.forEach(num => {
                const span = document.createElement('span');
                span.className = 'number';
                span.textContent = num;
                lottoNumbersContainer.appendChild(span);
            });
        }

        function addToHistory(numbers) {
            log('Adding to history.');
            const listItem = document.createElement('li');
            listItem.textContent = numbers.join(', ');
            historyList.prepend(listItem);
        }

        generateBtn.addEventListener('click', generateLottoNumbers);
        log('Click listener added to generate button.');

        // Initial generation on page load
        log('Performing initial number generation.');
        generateLottoNumbers();
    }

    // --- Water Down Calculator Logic ---
    // (Currently no JS needed as the price is hardcoded)
    // We could add a check for the bitcoin-price element if we add JS back later.
    const bitcoinPriceElement = document.getElementById('bitcoin-price');
    if (bitcoinPriceElement && bitcoinPriceElement.textContent === '로딩중...') {
         // This is a fallback in case the hardcoded value is removed
         bitcoinPriceElement.textContent = '업데이트 실패';
    }
});