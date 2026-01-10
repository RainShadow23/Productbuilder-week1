const numberSpans = document.querySelectorAll('.number');
const generateBtn = document.getElementById('generate-btn');
const historyList = document.getElementById('history-list');

const generateLottoNumbers = () => {
    const numbers = new Set();
    while (numbers.size < 6) {
        numbers.add(Math.floor(Math.random() * 45) + 1);
    }
    return Array.from(numbers).sort((a, b) => a - b);
};

const displayNumbers = (numbers) => {
    numberSpans.forEach((span, index) => {
        span.textContent = numbers[index];
        const numberValue = numbers[index];
        let backgroundColor;
        if (numberValue <= 10) {
            backgroundColor = '#f8c471'; // C
        } else if (numberValue <= 20) {
            backgroundColor = '#85c1e9'; // P
        } else if (numberValue <= 30) {
            backgroundColor = '#f39c12'; // O
        } else if (numberValue <= 40) {
            backgroundColor = '#a9dfbf'; // G
        } else {
            backgroundColor = '#f1948a'; // P
        }
        span.style.backgroundColor = backgroundColor;
    });
};

const addToHistory = (numbers) => {
    const li = document.createElement('li');
    li.textContent = numbers.join(', ');
    historyList.prepend(li);
};

const handleGenerateClick = () => {
    const newNumbers = generateLottoNumbers();
    displayNumbers(newNumbers);
    addToHistory(newNumbers);
};

generateBtn.addEventListener('click', handleGenerateClick);

// Initial generation
handleGenerateClick();