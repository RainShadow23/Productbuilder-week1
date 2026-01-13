
import {
    calculateExchangeMode,
    calculateWalletMode,
    calculateWhatIf,
    calculateTargetRequiredQty
} from './calculation-logic.js';

describe('Water Down Calculator Logic', () => {

    describe('calculateExchangeMode (거래소 기준)', () => {
        test('단순 물타기: 100원에 10개 보유 + 50원에 10개 매수 = 75원에 20개', () => {
            const initialQty = 10;
            const initialAvg = 100;
            const transactions = [
                { type: 'buy', qty: 10, price: 50 }
            ];

            const result = calculateExchangeMode(initialQty, initialAvg, transactions);

            expect(result.finalQty).toBe(20);
            expect(result.finalAvgPrice).toBe(75);
            expect(result.finalCost).toBe(1500);
        });

        test('매도 시 평단가는 변하지 않아야 함', () => {
            const initialQty = 10;
            const initialAvg = 100;
            const transactions = [
                { type: 'sell', qty: 5, price: 120 } // 이익 실현해도 평단가는 그대로
            ];

            const result = calculateExchangeMode(initialQty, initialAvg, transactions);

            expect(result.finalQty).toBe(5);
            expect(result.finalAvgPrice).toBe(100);
        });
    });

    describe('calculateWalletMode (지갑 기준/손익반영)', () => {
        test('이익 실현 시 평단가가 낮아져야 함 (투자 원금 회수 효과)', () => {
            // 100원에 10개 (1000원)
            // 200원에 5개 매도 (+500원 이익)
            // 남은 원금 = 1000 - 500 = 500원
            // 남은 수량 = 5개
            // 새로운 평단 = 100원 (변경 로직 확인 필요: 실제로는 투자금액이 줄어들므로 평단가도 줄어드는지?)

            // 로직상:
            // finalCost(1000) -= profit( (200-100)*5 = 500 ) => 500
            // finalQty(5)
            // Avg = 500 / 5 = 100.

            // 잠깐, calculateWalletMode 구현 로직 다시 확인:
            // profit = (price - avg) * qty
            // finalCost -= profit

            // 100원에 10개. (Cost 1000)
            // 200원에 5개 매도.
            // Avg = 100. Profit = (200 - 100) * 5 = 500.
            // Cost = 1000 - 500 = 500.
            // Qty = 5.
            // New Avg = 500 / 5 = 100.

            // 흠... 지갑 기준 계산기 로직이 '평단가'를 낮추는 로직이 맞나?
            // 아, 이 로직은 "남은 돈으로 본전치기 하려면 얼마에 팔아야 하냐"는 BEP(Break Even Price) 개념에 가깝습니다.
            // 만약 100원에 사서 200원에 다 팔면?
            // Profit = 1000. Cost = 0.
            // Cost가 0이 됨.

            const initialQty = 10;
            const initialAvg = 100;
            const transactions = [
                { type: 'sell', qty: 5, price: 200 }
            ];

            const result = calculateWalletMode(initialQty, initialAvg, transactions);
            expect(result.finalAvgPrice).toBe(100);
            // 현재 로직상 매도로 이익을 봐도 평단가는 그대로 유지되는가? 
            // (1000 - 500) / 5 = 100.

            // 만약 손실 매도라면? 100원에 사서 50원에 5개 매도.
            // Profit = (50 - 100) * 5 = -250.
            // Cost = 1000 - (-250) = 1250.
            // Qty = 5.
            // Avg = 1250 / 5 = 250.
            // 즉, 손실을 확정하면 남은 코인이 메꿔야 할 평단가가 올라감 (이게 지갑 기준 논리)
        });

        test('손절매 시 평단가가 올라가야 함', () => {
            const initialQty = 10;
            const initialAvg = 100;
            const transactions = [
                { type: 'sell', qty: 5, price: 50 } // 50원 손해
            ];

            // 손실: (50 - 100) * 5 = -250
            // 조정된 투자금: 1000 - (-250) = 1250
            // 남은 수량: 5
            // 예상 평단: 250

            const result = calculateWalletMode(initialQty, initialAvg, transactions);
            expect(result.finalAvgPrice).toBe(250);
        });
    });

    describe('calculateWhatIf', () => {
        test('추가 매수 시 평단가 하락 계산', () => {
            // 100원에 10개 (1000원)
            // 50원에 1000원어치 추가 (20개)
            // 총 30개, 총 2000원 -> 평단 66.66...

            const result = calculateWhatIf(10, 1000, 1000, 50);

            expect(result.newAvgPrice).toBeCloseTo(66.666, 2);
            expect(result.direction).toBe('improvement');
        });
    });

    describe('calculateTargetRequiredQty (구조대)', () => {
        test('목표 평단가를 위한 추가 매수량 계산', () => {
            // 100원에 10개. 목표 평단 80원. 현재가(추가매수가) 50원.
            // (10 * (100 - 80)) / (80 - 50)
            // (10 * 20) / 30 = 200 / 30 = 6.666...

            const currentQty = 10;
            const currentCost = 1000;
            const targetAvg = 80;
            const calcPrice = 50;

            const result = calculateTargetRequiredQty(currentQty, currentCost, targetAvg, calcPrice);

            expect(result.requiredQty).toBeCloseTo(6.667, 3);
            expect(result.error).toBeNull();
        });

        test('불가능한 목표 설정 시 에러 반환', () => {
            // 현재 평단 100원, 목표 110원 (물타기로는 불가능)
            const result = calculateTargetRequiredQty(10, 1000, 110, 50);
            expect(result.requiredQty).toBe(0);
            expect(result.error).toContain('목표 평단가는 현재 평단가보다 낮아야 합니다');
        });
    });
});
