// ============================================================
// 코인 선택 기능 (Coin Selector Module) - 개선 버전
// ============================================================

/**
 * 코인 선택 기능을 초기화하고 관리하는 모듈
 * - Upbit API에서 코인 목록 가져오기
 * - 검색 가능한 드롭다운
 * - 사용자 임의 코인 추가 및 관리
 * - 자동/수동 가격 모드 전환
 */

(function () {
    'use strict';

    // ============================================================
    // 전역 변수 및 설정
    // ============================================================

    const POPULAR_COINS = ['BTC', 'ETH', 'XRP', 'SOL', 'DOGE', 'ADA', 'AVAX', 'DOT'];
    let allCoins = [];
    let customCoins = JSON.parse(localStorage.getItem('customCoins')) || [];
    let currentSelectedCoin = null;

    // ============================================================
    // DOM 요소
    // ============================================================

    const coinSearchInput = document.getElementById('coin-search');
    const coinDropdown = document.getElementById('coin-dropdown');
    const popularCoinsContainer = document.getElementById('popular-coins');
    const searchResultsContainer = document.getElementById('search-results');
    const customCoinOption = document.getElementById('custom-coin-add-option'); // Fixed ID
    const customCoinText = document.getElementById('custom-coin-name'); // Fixed ID
    const selectedCoinDisplay = document.getElementById('selected-coin-display');
    const currentPriceLabel = document.getElementById('current-price-label');
    const priceSourceBadge = document.getElementById('price-source-badge');
    const currentPriceInput = document.getElementById('current-price');
    const priceUpdateTime = document.getElementById('price-update-time');
    const priceCheckerSection = document.getElementById('price-checker-section');
    const priceCheckerToggle = document.getElementById('price-checker-toggle');
    const priceCheckerIcon = document.getElementById('price-checker-icon');
    const priceCheckerContent = document.getElementById('price-checker-content');
    const priceCheckerIframe = document.getElementById('price-checker-iframe');

    // ============================================================
    // API 함수
    // ============================================================

    /**
     * Upbit API에서 전체 코인 목록을 가져옵니다
     */
    async function fetchAllCoins() {
        try {
            // 1. Try Proxy
            let response = await fetch('https://upbit-proxy.ooktone.workers.dev/v1/market/all');
            if (!response.ok) {
                // 2. Try Direct
                console.warn('Proxy failed, trying direct Upbit API...');
                response = await fetch('https://api.upbit.com/v1/market/all?isDetails=false');
            }
            if (!response.ok) throw new Error('All APIs failed');

            const data = await response.json();

            // KRW 마켓만 필터링
            allCoins = data
                .filter(coin => coin.market.startsWith('KRW-'))
                .map(coin => ({
                    symbol: coin.market.replace('KRW-', ''),
                    market: coin.market,
                    koreanName: coin.korean_name,
                    englishName: coin.english_name,
                    isCustom: false
                }));

            console.log(`${allCoins.length}개의 코인을 불러왔습니다.`);
            return allCoins;
        } catch (error) {
            console.error('코인 목록 로드 실패, 백업 목록을 사용합니다:', error);
            // 3. Fallback
            allCoins = [
                { symbol: 'BTC', market: 'KRW-BTC', koreanName: '비트코인', englishName: 'Bitcoin', isCustom: false },
                { symbol: 'ETH', market: 'KRW-ETH', koreanName: '이더리움', englishName: 'Ethereum', isCustom: false },
                { symbol: 'XRP', market: 'KRW-XRP', koreanName: '리플', englishName: 'Ripple', isCustom: false },
                { symbol: 'SOL', market: 'KRW-SOL', koreanName: '솔라나', englishName: 'Solana', isCustom: false },
                { symbol: 'ADA', market: 'KRW-ADA', koreanName: '에이다', englishName: 'Cardano', isCustom: false },
                { symbol: 'DOGE', market: 'KRW-DOGE', koreanName: '도지코인', englishName: 'Dogecoin', isCustom: false },
                { symbol: 'AVAX', market: 'KRW-AVAX', koreanName: '아발란체', englishName: 'Avalanche', isCustom: false },
                { symbol: 'DOT', market: 'KRW-DOT', koreanName: '폴카닷', englishName: 'Polkadot', isCustom: false },
                { symbol: 'MATIC', market: 'KRW-MATIC', koreanName: '폴리곤', englishName: 'Polygon', isCustom: false }
            ];
            return allCoins;
        }
    }

    /**
     * 특정 코인의 현재 가격을 가져옵니다
     */
    async function fetchCoinPrice(symbol) {
        try {
            const market = `KRW-${symbol}`;
            const workerUrl = `https://upbit-proxy.ooktone.workers.dev/v1/ticker?markets=${market}`;
            const response = await fetch(workerUrl);
            if (!response.ok) throw new Error(`API response not OK: ${response.status}`);
            const data = await response.json();

            if (data && data.length > 0) {
                return data[0].trade_price;
            }
            throw new Error('No price data');
        } catch (error) {
            console.error(`${symbol} 가격 로드 실패:`, error);
            return null;
        }
    }

    // ============================================================
    // UI 렌더링 함수
    // ============================================================

    /**
     * 인기 코인 목록을 렌더링합니다
     */
    function renderPopularCoins() {
        popularCoinsContainer.innerHTML = '';

        POPULAR_COINS.forEach(symbol => {
            const coin = allCoins.find(c => c.symbol === symbol);
            if (coin) {
                const coinItem = createCoinItem(coin);
                popularCoinsContainer.appendChild(coinItem);
            }
        });
    }

    /**
     * 커스텀 코인 목록을 렌더링합니다
     */
    function renderCustomCoins() {
        // 커스텀 코인 섹션 찾기
        const sections = coinDropdown.querySelectorAll('.coin-dropdown-section');
        const customSection = sections[0];
        // Use ID for safer selection
        const customContainer = document.getElementById('custom-coins-container');

        if (!customContainer) {
            console.error('Custom coin container not found');
            return;
        }

        if (customCoins.length === 0) {
            customSection.style.display = 'none';
            return;
        }

        customSection.style.display = 'block';
        customContainer.innerHTML = '';

        customCoins.forEach(coin => {
            const coinItem = createCoinItem(coin);
            customContainer.appendChild(coinItem);
        });
    }

    /**
     * 검색 결과를 렌더링합니다
     */
    function renderSearchResults(query) {
        const sections = coinDropdown.querySelectorAll('.coin-dropdown-section');
        const popularSection = sections[1]; // 인기 코인 섹션
        const searchSection = sections[2];  // 검색 결과 섹션

        searchResultsContainer.innerHTML = '';

        if (!query) {
            // 검색어가 없을 때: 인기 코인 표시, 검색 결과 숨김
            popularSection.style.display = 'block';
            searchSection.style.display = 'none';
            customCoinOption.style.display = 'none';
            return;
        }

        // 검색어가 있을 때: 인기 코인 숨김, 검색 결과 표시
        popularSection.style.display = 'none';
        searchSection.style.display = 'block';

        const searchTerm = query.toUpperCase();

        // Upbit 코인 검색
        const upbitResults = allCoins.filter(coin =>
            coin.symbol.includes(searchTerm) ||
            coin.koreanName.includes(query) ||
            coin.englishName.toUpperCase().includes(searchTerm)
        ).slice(0, 10); // 최대 10개

        // 커스텀 코인 검색
        const customResults = customCoins.filter(coin =>
            coin.symbol.includes(searchTerm) ||
            coin.koreanName.includes(query)
        );

        const allResults = [...customResults, ...upbitResults];

        if (allResults.length === 0) {
            searchResultsContainer.innerHTML = '<div class="coin-dropdown-empty">검색 결과가 없습니다</div>';

            // 커스텀 코인 추가 옵션 표시
            if (searchTerm.length >= 2) {
                customCoinText.textContent = `"${searchTerm}" 직접 추가하기`;
                customCoinOption.style.display = 'block';
            } else {
                customCoinOption.style.display = 'none';
            }
        } else {
            allResults.forEach(coin => {
                const coinItem = createCoinItem(coin);
                searchResultsContainer.appendChild(coinItem);
            });
            customCoinOption.style.display = 'none';
        }
    }

    /**
     * 코인 아이템 DOM 요소를 생성합니다
     */
    function createCoinItem(coin) {
        const div = document.createElement('div');
        div.className = 'coin-item';
        div.innerHTML = `
            <div class="coin-item-main">
                <span class="coin-item-symbol">${coin.symbol}</span>
                <span class="coin-item-name">${coin.koreanName}</span>
            </div>
            ${coin.isCustom ? '<span class="coin-item-market">사용자 추가</span>' : ''}
        `;

        div.addEventListener('click', () => selectCoin(coin));
        return div;
    }

    // ============================================================
    // 코인 선택 및 관리
    // ============================================================

    /**
     * 코인을 선택하고 UI를 업데이트합니다
     */
    async function selectCoin(coin) {
        // 현재 코인의 데이터를 저장 (다른 코인으로 전환하기 전)
        if (currentSelectedCoin && typeof window.saveState === 'function') {
            window.saveState();
            console.log(`${currentSelectedCoin.symbol} 코인의 데이터를 저장했습니다.`);
        } else if (currentSelectedCoin) {
            console.warn('saveState function not available yet.');
        }

        currentSelectedCoin = coin;

        // UI 업데이트
        selectedCoinDisplay.querySelector('.coin-symbol').textContent = coin.symbol;
        selectedCoinDisplay.querySelector('.coin-name').textContent = coin.koreanName;
        currentPriceLabel.textContent = coin.koreanName;

        // 드롭다운 닫기
        coinDropdown.style.display = 'none';
        coinSearchInput.value = '';

        // 전역 currentCoin 변수 업데이트 (main.js와 연동)
        if (window.currentCoin !== undefined) {
            window.currentCoin = coin.symbol;
        }

        // 가격 모드 설정
        if (coin.isCustom) {
            // 커스텀 코인: 수동 입력 모드
            setPriceMode('manual');
            currentPriceInput.readOnly = false;

            // 저장된 가격 불러오기
            const savedPrice = loadCustomCoinPrice(coin.symbol);
            if (savedPrice && savedPrice.price) {
                currentPriceInput.value = savedPrice.price.toLocaleString();
            } else {
                currentPriceInput.value = '';
                currentPriceInput.placeholder = '가격을 직접 입력하세요';
            }

            // 가격 확인 섹션 표시
            priceCheckerSection.style.display = 'block';
            priceCheckerContent.style.display = 'none';
            priceCheckerIcon.classList.remove('expanded');

            // 타임스탬프 업데이트
            updatePriceTimestamp();
        } else {
            // Upbit 코인: 자동 가격 가져오기
            setPriceMode('auto');
            currentPriceInput.placeholder = '로딩중...';
            currentPriceInput.readOnly = true;

            // 가격 확인 섹션 숨김
            priceCheckerSection.style.display = 'none';
            priceUpdateTime.style.display = 'none';

            const price = await fetchCoinPrice(coin.symbol);
            if (price) {
                currentPriceInput.value = price.toLocaleString();
            } else {
                currentPriceInput.value = '가격 로드 실패';
            }
        }

        // 새로운 코인의 저장된 데이터 불러오기
        if (typeof window.loadCoinData === 'function') {
            window.loadCoinData(coin.symbol);
            console.log(`${coin.symbol} 코인의 데이터를 불러왔습니다.`);
        } else {
            console.warn('loadCoinData function not available yet. Retrying in 500ms...');
            setTimeout(() => {
                if (typeof window.loadCoinData === 'function' && window.currentCoin === coin.symbol) {
                    window.loadCoinData(coin.symbol);
                }
            }, 500);
        }

        // 상태 저장 (main.js의 saveState 호출)
        if (typeof window.saveState === 'function') {
            window.saveState();
        }
    }

    /**
     * 가격 모드를 설정합니다 (auto/manual)
     */
    function setPriceMode(mode) {
        if (mode === 'auto') {
            priceSourceBadge.textContent = '자동';
            priceSourceBadge.classList.remove('manual');
        } else {
            priceSourceBadge.textContent = '수동';
            priceSourceBadge.classList.add('manual');
        }
    }

    /**
     * 커스텀 코인을 추가합니다
     */
    function addCustomCoin(symbol) {
        const newCoin = {
            symbol: symbol.toUpperCase(),
            market: `CUSTOM-${symbol.toUpperCase()}`,
            koreanName: symbol.toUpperCase(),
            englishName: symbol.toUpperCase(),
            isCustom: true
        };

        // 중복 체크
        if (customCoins.some(c => c.symbol === newCoin.symbol)) {
            alert('이미 추가된 코인입니다.');
            return;
        }

        customCoins.push(newCoin);
        localStorage.setItem('customCoins', JSON.stringify(customCoins));

        // 커스텀 코인 섹션 다시 렌더링
        renderCustomCoins();

        // 즉시 선택
        selectCoin(newCoin);
    }

    // ============================================================
    // 이벤트 리스너
    // ============================================================

    /**
     * 키보드 네비게이션
     */
    let highlightedIndex = -1;

    coinSearchInput.addEventListener('keydown', (e) => {
        const sections = coinDropdown.querySelectorAll('.coin-dropdown-section');
        // Only consider items in currently visible sections
        let visibleItems = [];
        sections.forEach(section => {
            if (section.style.display !== 'none') {
                // The second div in section contains the items
                // Check coin-selector.js render logic: 
                // renderCustomCoins: customContainer = customSection.querySelectorAll('div')[1]
                // This structure seems to rely on generic divs. Safer to querySelectorAll('.coin-item') within visible sections.
                const items = section.querySelectorAll('.coin-item');
                visibleItems = visibleItems.concat(Array.from(items));
            }
        });

        // Add "Add Custom Coin" option if visible
        if (customCoinOption.style.display !== 'none' && coinSearchInput.value.length >= 2) {
            visibleItems.push(customCoinOption);
        }

        if (visibleItems.length === 0 || coinDropdown.style.display === 'none') {
            if (e.key === 'Enter') {
                e.preventDefault(); // Prevent form submission if any
            }
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            highlightedIndex++;
            if (highlightedIndex >= visibleItems.length) highlightedIndex = 0;
            updateHighlight(visibleItems);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            highlightedIndex--;
            if (highlightedIndex < 0) highlightedIndex = visibleItems.length - 1;
            updateHighlight(visibleItems);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightedIndex >= 0 && highlightedIndex < visibleItems.length) {
                visibleItems[highlightedIndex].click();
            }
        }
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

    /**
     * 검색 입력 이벤트
     */
    coinSearchInput.addEventListener('focus', () => {
        coinDropdown.style.display = 'block';
        if (!coinSearchInput.value) {
            renderSearchResults('');
        }
    });

    coinSearchInput.addEventListener('input', (e) => {
        highlightedIndex = -1; // Reset highlight
        const query = e.target.value.trim();
        renderSearchResults(query);
        coinDropdown.style.display = 'block';
    });

    /**
     * 커스텀 코인 추가 클릭
     */
    customCoinOption.addEventListener('click', () => {
        const symbol = coinSearchInput.value.trim().toUpperCase();
        if (symbol.length >= 2) {
            addCustomCoin(symbol);
        }
    });

    /**
     * 드롭다운 외부 클릭 시 닫기
     */
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.coin-selector-wrapper')) {
            coinDropdown.style.display = 'none';
        }
    });

    // ============================================================
    // 초기화
    // ============================================================

    /**
     * 코인 선택 기능을 초기화합니다
     */
    async function initCoinSelector() {
        // Upbit 코인 목록 로드
        await fetchAllCoins();

        // 인기 코인 렌더링
        renderPopularCoins();

        // 커스텀 코인 렌더링
        renderCustomCoins();

        // 기본 코인 선택 (BTC)
        const defaultCoin = allCoins.find(c => c.symbol === 'BTC');
        if (defaultCoin) {
            currentSelectedCoin = defaultCoin;
        }

        console.log('코인 선택 기능 초기화 완료');
        console.log(`커스텀 코인: ${customCoins.length}개`);
    }

    // 페이지 로드 시 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCoinSelector);
    } else {
        initCoinSelector();
    }

    // 전역 함수 노출 (main.js에서 사용)
    window.coinSelector = {
        selectCoin,
        getCurrentCoin: () => currentSelectedCoin,
        fetchCoinPrice,
        renderCustomCoins
    };

    // ============================================================
    // 유틸리티 함수 (가격 업데이트 시간 및 가격 확인)
    // ============================================================

    /**
     * 시간 차이를 사람이 읽기 쉬운 형식으로 변환
     */
    function getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return '방금 전';
        if (minutes < 60) return `${minutes}분 전`;
        if (hours < 24) return `${hours}시간 전`;
        return `${days}일 전`;
    }

    /**
     * 가격 업데이트 시간 표시
     */
    function updatePriceTimestamp() {
        const coin = currentSelectedCoin;
        if (!coin || !coin.isCustom) {
            priceUpdateTime.style.display = 'none';
            return;
        }

        // 커스텀 코인의 마지막 가격 업데이트 시간 가져오기
        const priceData = JSON.parse(localStorage.getItem('customCoinPrices')) || {};
        const coinData = priceData[coin.symbol];

        if (coinData && coinData.timestamp) {
            const timeAgo = getTimeAgo(coinData.timestamp);
            priceUpdateTime.textContent = `마지막 업데이트: ${timeAgo}`;
            priceUpdateTime.style.display = 'block';
        } else {
            priceUpdateTime.style.display = 'none';
        }
    }

    /**
     * 커스텀 코인 가격 저장
     */
    function saveCustomCoinPrice(symbol, price) {
        const priceData = JSON.parse(localStorage.getItem('customCoinPrices')) || {};
        priceData[symbol] = {
            price: price,
            timestamp: Date.now()
        };
        localStorage.setItem('customCoinPrices', JSON.stringify(priceData));
        updatePriceTimestamp();
    }

    /**
     * 커스텀 코인 가격 불러오기
     */
    function loadCustomCoinPrice(symbol) {
        const priceData = JSON.parse(localStorage.getItem('customCoinPrices')) || {};
        return priceData[symbol];
    }

    /**
     * 가격 확인 섹션 토글
     */
    function togglePriceChecker() {
        const isExpanded = priceCheckerContent.style.display === 'block';

        if (isExpanded) {
            priceCheckerContent.style.display = 'none';
            priceCheckerIcon.classList.remove('expanded');
        } else {
            priceCheckerContent.style.display = 'block';
            priceCheckerIcon.classList.add('expanded');

            // iframe URL 설정 (CoinGecko 검색)
            const coinSymbol = currentSelectedCoin?.symbol || '';
            priceCheckerIframe.src = `https://www.coingecko.com/en/search_redirect?id=${coinSymbol.toLowerCase()}&type=coin`;
        }
    }

    // 가격 입력 이벤트 리스너 (커스텀 코인 가격 저장)
    currentPriceInput.addEventListener('change', () => {
        if (currentSelectedCoin && currentSelectedCoin.isCustom) {
            const price = currentPriceInput.value.replace(/,/g, '');
            if (price && !isNaN(price)) {
                saveCustomCoinPrice(currentSelectedCoin.symbol, parseFloat(price));
            }
        }
    });

    // 가격 확인 토글 버튼 이벤트
    if (priceCheckerToggle) {
        priceCheckerToggle.addEventListener('click', togglePriceChecker);
    }

    // 주기적으로 시간 업데이트 (1분마다)
    setInterval(updatePriceTimestamp, 60000);

})();
