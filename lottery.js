
document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generate-btn');
    const numberSpans = document.querySelectorAll('.lotto-numbers .number');
    const historyList = document.getElementById('history-list');

    // Theme Toggle Logic
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
        if (localStorage.getItem('theme') === 'light') document.body.classList.add('light');
        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('light');
            localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
        });
    }

    // Load history from localStorage
    const history = JSON.parse(localStorage.getItem('lottoHistory')) || [];
    renderHistory();

    generateBtn.addEventListener('click', generateNumbers);

    function generateNumbers() {
        const numbers = [];
        while (numbers.length < 6) {
            const num = Math.floor(Math.random() * 45) + 1;
            if (!numbers.includes(num)) {
                numbers.push(num);
            }
        }
        numbers.sort((a, b) => a - b);

        // Animate and display numbers
        numberSpans.forEach((span, index) => {
            setTimeout(() => {
                const num = numbers[index];
                span.textContent = num;
                applyColor(span, num);
                span.classList.add('pop');
                setTimeout(() => span.classList.remove('pop'), 300);
            }, index * 100);
        });

        // Save to history
        const timestamp = new Date().toLocaleString();
        history.unshift({ numbers, timestamp });
        if (history.length > 10) history.pop(); // Keep last 10
        localStorage.setItem('lottoHistory', JSON.stringify(history));
        renderHistory();
    }

    function applyColor(element, num) {
        element.className = 'number'; // Reset classes
        if (num <= 10) element.classList.add('yellow');
        else if (num <= 20) element.classList.add('blue');
        else if (num <= 30) element.classList.add('red');
        else if (num <= 40) element.classList.add('gray');
        else element.classList.add('green');
    }

    function renderHistory() {
        historyList.innerHTML = '';
        history.forEach(item => {
            const li = document.createElement('li');
            li.className = 'history-item';

            const numbersDiv = document.createElement('div');
            numbersDiv.className = 'history-numbers';

            item.numbers.forEach(num => {
                const span = document.createElement('span');
                span.className = 'history-number';
                span.textContent = num;
                applyColor(span, num);
                numbersDiv.appendChild(span);
            });

            const timeSpan = document.createElement('span');
            timeSpan.className = 'history-time';
            timeSpan.textContent = item.timestamp;

            li.appendChild(numbersDiv);
            li.appendChild(timeSpan);
            historyList.appendChild(li);
        });
    }
});
