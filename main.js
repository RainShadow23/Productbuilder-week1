document.addEventListener('DOMContentLoaded', () => {

    const themeToggleBtn = document.getElementById('theme-toggle');

    // Theme switching logic
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

    // The Bitcoin price is now hardcoded in water_down_calculator.html.
    // The fetchBitcoinPrice function has been removed.

    // Lotto Number Generator specific logic
    if (window.location.pathname.includes('lottery.html')) {
        const lottoNumbersContainer = document.querySelector('.lotto-numbers');
        const generateBtn = document.getElementById('generate-btn');
        const historyList = document.getElementById('history-list');

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

        if (generateBtn) {
            generateBtn.addEventListener('click', generateLottoNumbers);
        }

        // Initial generation on page load
        generateLottoNumbers();
    }

    // Check current page and call relevant functions
    // The water_down_calculator.html page no longer requires a fetch call.
});