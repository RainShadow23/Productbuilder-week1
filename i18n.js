// i18n.js - Internationalization System for Water Down Helper
// Supports Korean (ko) and English (en)

const translations = {
    ko: {
        // Common
        'theme.toggle': '테마 변경',
        'home.link': '홈으로 돌아가기',
        'footer.manual': '📖 사용 설명서',
        'footer.contact': '📧 문의/버그 제보',
        'footer.copyright': '© 2026 Water Down Helper. All rights reserved.',

        // Index Page
        'index.title': '물타기 도우미',
        'index.subtitle': '전략적인 추가 매수로 위기를 기회로 바꾸세요.',
        'index.stock.title': '주식 물타기',
        'index.stock.desc': '네이버 증권 연동<br>국내 주식 맞춤형',
        'index.coin.title': '코인 물타기',
        'index.coin.desc': '업비트 시세 자동 연동<br>실시간 계산',
        'index.break.title': '잠깐! 머리 좀 식히고 가세요 ☕',
        'index.lottery.link': '🎱 재미로 보는 로또 번호 생성기',

        // Calculator Common
        'calc.stock.title': '주식 물타기 계산기',
        'calc.coin.title': '코인 물타기 계산기',
        'calc.nav.to.coin': '코인 계산기 가기',
        'calc.nav.to.stock': '주식 계산기 가기',
        'calc.mode.wallet': '내 지갑 기준',
        'calc.mode.exchange': '거래소 기준',
        'calc.coin.label': '코인 선택:',
        'calc.stock.label': '종목 선택:',
        'calc.search.placeholder.coin': '코인명 또는 심볼 검색 (예: 비트코인, BTC)',
        'calc.search.placeholder.stock': '종목명 또는 코드 검색 (예: 삼성전자, 005930)',
        'calc.price.current': '현재가 (KRW)',
        'calc.price.placeholder': '현재가 입력',
        'calc.info.title': '기본 정보 (평단가 계산에 필요)',
        'calc.qty': '보유 수량',
        'calc.qty.placeholder': '보유 수량',
        'calc.avg.price': '보유 평단가',
        'calc.avg.price.placeholder': '보유 평단가',
        'calc.transactions.title': '거래 내역 (전체 계산기용)',
        'calc.transaction.add': '+ 거래 내역 추가',
        'calc.transaction.buy': '추가 매수',
        'calc.transaction.sell': '매도',
        'calc.transaction.qty': '수량',
        'calc.transaction.qty.placeholder': '수량',
        'calc.transaction.price': '가격',
        'calc.transaction.price.placeholder': '가격',
        'calc.calculate': '전체 결과 계산하기',
        'calc.share': '공유 링크',
        'calc.backup': '백업(.json)',
        'calc.restore': '파일 복원',
        'calc.reset': '초기화',
        'calc.price.input.placeholder': '현재가 또는 직접 입력',
        'calc.whatif.amount.placeholder': '추가 매수 금액',
        'calc.target.price.placeholder': '목표 평단가',

        // Results
        'result.title': '계산 결과',
        'result.total.qty': '최종 보유 수량:',
        'result.total.investment': '총 투자 금액:',
        'result.final.avg': '최종 평단가:',
        'result.total.eval': '총 평가 금액:',
        'result.pnl': '평가 손익:',
        'result.return': '수익률:',

        // What-if Section
        'whatif.title': '이렇게 물을 타면 내 평단가는?',
        'whatif.price.label': '얼마에 더 살까요? (추가 매수 희망가)',
        'whatif.amount': '추가 매수 금액',
        'whatif.calculate': '결과 미리보기',
        'whatif.current': '현재 평단가',
        'whatif.new': '예상 평단가',

        // Target Section
        'target.title': '구조대(목표 평단)가 오려면?',
        'target.price': '목표 평단가',
        'target.calculate': '필요 금액 계산',
        'target.result.investment': '💰 필요 투자금:',
        'target.result.buy': '추가 매수',

        // Dynamic Messages
        'msg.auto': '자동',
        'msg.manual': '수동',
        'msg.increase': '상승',
        'msg.decrease': '하락',
        'msg.no.holdings': '보유 정보를 입력해주세요.',
        'msg.no.quantity': '보유 수량이 없습니다.',
        'msg.cannot.lower': '현재 평단가가 계산 기준 가격보다 낮아 평단가를 더 낮출 수 없습니다.',
        'msg.please.enter.holdings': '보유 정보를 입력해주세요.',

        // Lottery
        'lottery.title': '로또 번호 생성기',
        'lottery.generate': '번호 생성',
        'lottery.history': '생성 내역',

        // Manual
        'manual.title': '📖 사용 설명서',
        'manual.subtitle': '현명한 투자 전략을 위한 물타기 계산기 사용법입니다.',

        // Contact
        'contact.title': '제휴 문의',
        'contact.subtitle': '제휴 파트너십에 관한 문의는 아래 양식을 이용해 주세요.',
        'contact.name': '이름:',
        'contact.email': '이메일:',
        'contact.message': '메시지:',
        'contact.submit': '문의 보내기',
    },

    en: {
        // Common
        'theme.toggle': 'Toggle Theme',
        'home.link': 'Back to Home',
        'footer.manual': '📖 User Manual',
        'footer.contact': '📧 Contact/Bug Report',
        'footer.copyright': '© 2026 Water Down Helper. All rights reserved.',

        // Index Page
        'index.title': 'Water Down Helper',
        'index.subtitle': 'Turn crisis into opportunity with strategic buying.',
        'index.stock.title': 'Stock Calculator',
        'index.stock.desc': 'Naver Finance Integration<br>For Korean Stocks',
        'index.coin.title': 'Crypto Calculator',
        'index.coin.desc': 'Upbit Price Auto Sync<br>Real-time Calculation',
        'index.break.title': 'Take a break ☕',
        'index.lottery.link': '🎱 Lottery Number Generator',

        // Calculator Common
        'calc.stock.title': 'Stock Calculator',
        'calc.coin.title': 'Crypto Calculator',
        'calc.nav.to.coin': 'Go to Crypto Calculator',
        'calc.nav.to.stock': 'Go to Stock Calculator',
        'calc.mode.wallet': 'My Wallet',
        'calc.mode.exchange': 'Exchange',
        'calc.coin.label': 'Select Coin:',
        'calc.stock.label': 'Select Stock:',
        'calc.search.placeholder.coin': 'Search coin name or symbol (e.g., Bitcoin, BTC)',
        'calc.search.placeholder.stock': 'Search stock name or code (e.g., Samsung, 005930)',
        'calc.price.current': 'Current Price (KRW)',
        'calc.price.placeholder': 'Enter current price',
        'calc.info.title': 'Basic Info (Required for average price)',
        'calc.qty': 'Quantity',
        'calc.qty.placeholder': 'Quantity',
        'calc.avg.price': 'Average Price',
        'calc.avg.price.placeholder': 'Average Price',
        'calc.transactions.title': 'Transaction History',
        'calc.transaction.add': '+ Add Transaction',
        'calc.transaction.buy': 'Buy',
        'calc.transaction.sell': 'Sell',
        'calc.transaction.qty': 'Quantity',
        'calc.transaction.qty.placeholder': 'Quantity',
        'calc.transaction.price': 'Price',
        'calc.transaction.price.placeholder': 'Price',
        'calc.calculate': 'Calculate Results',
        'calc.share': 'Share Link',
        'calc.backup': 'Backup (.json)',
        'calc.restore': 'Restore File',
        'calc.reset': 'Reset',
        'calc.price.input.placeholder': 'Current price or enter manually',
        'calc.whatif.amount.placeholder': 'Additional amount',
        'calc.target.price.placeholder': 'Target average price',

        // Results
        'result.title': 'Calculation Results',
        'result.total.qty': 'Total Quantity:',
        'result.total.investment': 'Total Investment:',
        'result.final.avg': 'Final Avg Price:',
        'result.total.eval': 'Total Value:',
        'result.pnl': 'P&L:',
        'result.return': 'Return:',

        // What-if Section
        'whatif.title': 'What if I buy more?',
        'whatif.price.label': 'At what price? (Target buy price)',
        'whatif.amount': 'Additional Amount',
        'whatif.calculate': 'Preview Results',
        'whatif.current': 'Current Avg',
        'whatif.new': 'New Avg',

        // Target Section
        'target.title': 'How to reach target average?',
        'target.price': 'Target Average Price',
        'target.calculate': 'Calculate Amount Needed',
        'target.result.investment': '💰 Investment Needed:',
        'target.result.buy': 'additional buy',

        // Dynamic Messages
        'msg.auto': 'Auto',
        'msg.manual': 'Manual',
        'msg.increase': 'Increase',
        'msg.decrease': 'Decrease',
        'msg.no.holdings': 'Please enter your holdings information.',
        'msg.no.quantity': 'No quantity held.',
        'msg.cannot.lower': 'Current average is already below calculation price. Cannot lower further.',
        'msg.please.enter.holdings': 'Please enter your holdings information.',

        // Lottery
        'lottery.title': 'Lottery Number Generator',
        'lottery.generate': 'Generate Numbers',
        'lottery.history': 'History',

        // Manual
        'manual.title': '📖 User Manual',
        'manual.subtitle': 'Learn how to use our investment calculators.',

        // Contact
        'contact.title': 'Partnership Inquiry',
        'contact.subtitle': 'Please use the form below for partnership inquiries.',
        'contact.name': 'Name:',
        'contact.email': 'Email:',
        'contact.message': 'Message:',
        'contact.submit': 'Send Inquiry',
    }
};

// i18n System
const i18n = {
    currentLang: localStorage.getItem('language') || 'ko',

    // Initialize i18n on page load
    init() {
        this.applyTranslations();
        this.addLanguageToggle();
    },

    // Switch language
    setLanguage(lang) {
        if (lang !== 'ko' && lang !== 'en') return;
        this.currentLang = lang;
        localStorage.setItem('language', lang);
        this.applyTranslations();
    },

    // Get translation
    t(key) {
        return translations[this.currentLang][key] || key;
    },

    // Apply translations to all elements with data-i18n attribute
    applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = this.t(key);

            // Check if element is an input placeholder
            if (el.tagName === 'INPUT' && el.hasAttribute('placeholder')) {
                el.placeholder = translation;
            } else {
                el.innerHTML = translation;
            }
        });

        // Update page title if exists
        const titleKey = document.body.getAttribute('data-i18n-title');
        if (titleKey) {
            document.title = this.t(titleKey);
        }
    },

    // Add language toggle button
    addLanguageToggle() {
        // Check if toggle already exists
        if (document.getElementById('lang-toggle')) return;

        const toggle = document.createElement('button');
        toggle.id = 'lang-toggle';
        toggle.className = 'lang-toggle';
        toggle.textContent = this.currentLang === 'ko' ? 'EN' : '한';
        toggle.setAttribute('aria-label', 'Toggle Language');

        toggle.addEventListener('click', () => {
            const newLang = this.currentLang === 'ko' ? 'en' : 'ko';
            this.setLanguage(newLang);
            toggle.textContent = newLang === 'ko' ? 'EN' : '한';
        });

        document.body.appendChild(toggle);
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => i18n.init());
} else {
    i18n.init();
}
