
// stock-selector.js
// stock-data.js가 먼저 로드되어 있어야 합니다.

document.addEventListener('DOMContentLoaded', () => {

    // --- Elements ---
    const coinSearchInput = document.getElementById('coin-search');
    const coinDropdown = document.getElementById('coin-dropdown');
    const searchResultsDiv = document.getElementById('search-results');
    const selectedCoinDisplay = document.getElementById('selected-coin-display');
    const coinSymbolSpan = selectedCoinDisplay.querySelector('.coin-symbol');
    const coinNameSpan = selectedCoinDisplay.querySelector('.coin-name');
    const naverLinkBtn = document.getElementById('naver-link-btn');
    const currentPriceLabel = document.getElementById('current-price-label');

    // --- State ---
    if (typeof stockList === 'undefined') {
        console.error('stockList is undefined. stock-data.js might not be loaded.');
    }
    const stocks = (typeof stockList !== 'undefined') ? stockList : [];
    let selectedStock = stocks.find(s => s.name === '삼성전자') || stocks[0] || { name: '삼성전자', code: '005930' }; // Default

    // --- Initialization ---
    updateSelectedStockUI(selectedStock);

    // --- Event Listeners ---
    let highlightedIndex = -1; // -1 means nothing highlighted

    coinSearchInput.addEventListener('keydown', (e) => {
        const items = searchResultsDiv.querySelectorAll('.coin-item');
        if (items.length === 0 || coinDropdown.style.display === 'none') {
            if (e.key === 'Enter') {
                // Trigger search if needed or do nothing
                e.preventDefault();
            }
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            highlightedIndex++;
            if (highlightedIndex >= items.length) highlightedIndex = 0;
            updateHighlight(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            highlightedIndex--;
            if (highlightedIndex < 0) highlightedIndex = items.length - 1;
            updateHighlight(items);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightedIndex >= 0 && highlightedIndex < items.length) {
                items[highlightedIndex].click();
            }
        }
    });

    coinSearchInput.addEventListener('input', (e) => {
        highlightedIndex = -1;
        const query = e.target.value.trim().toLowerCase();
        if (query.length === 0) {
            coinDropdown.style.display = 'none';
            return;
        }

        const filtered = stocks.filter(stock =>
            stock.name.toLowerCase().includes(query) || stock.code.includes(query)
        );

        renderSearchResults(filtered);
    });

    function updateHighlight(items) {
        items.forEach((item, index) => {
            if (index === highlightedIndex) {
                item.classList.add('highlighted');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('highlighted');
            }
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!coinSearchInput.contains(e.target) && !coinDropdown.contains(e.target)) {
            coinDropdown.style.display = 'none';
        }
    });

    coinSearchInput.addEventListener('focus', () => {
        if (coinSearchInput.value.trim().length > 0) {
            coinDropdown.style.display = 'block';
        }
    });

    // --- Functions ---
    function renderSearchResults(results) {
        searchResultsDiv.innerHTML = '';
        if (results.length === 0) {
            searchResultsDiv.innerHTML = '<div class="coin-item">검색 결과가 없습니다</div>';
        } else {
            results.forEach(stock => {
                const div = document.createElement('div');
                div.className = 'coin-item';
                div.innerHTML = `<span style="font-weight:bold;">${stock.name}</span> <span style="font-size:0.8em; color:#666;">(${stock.code})</span>`;
                div.addEventListener('click', () => {
                    selectStock(stock);
                });
                searchResultsDiv.appendChild(div);
            });
        }
        coinDropdown.style.display = 'block';
    }

    function selectStock(stock) {
        selectedStock = stock;
        updateSelectedStockUI(stock);
        coinDropdown.style.display = 'none';
        coinSearchInput.value = ''; // clear search
    }

    function updateSelectedStockUI(stock) {
        // UI Text
        coinSymbolSpan.textContent = stock.code;
        coinNameSpan.textContent = stock.name;
        currentPriceLabel.textContent = stock.name;

        // Naver Link
        naverLinkBtn.href = `https://finance.naver.com/item/main.naver?code=${stock.code}`;
        naverLinkBtn.style.display = 'inline-flex';

        // Window Global State (for main.js to use if needed, though stocks use manual price mostly)
        window.currentCoin = stock.code;

        // Trigger load state if using shared main.js logic (will try to load '005930' from localstorage)
        if (typeof window.loadCoinData === 'function') {
            window.loadCoinData(stock.code);
        } else {
            console.warn('loadCoinData function not available yet. Retrying in 500ms...');
            setTimeout(() => {
                if (typeof window.loadCoinData === 'function') {
                    window.loadCoinData(stock.code);
                }
            }, 500);
        }
    }
});
