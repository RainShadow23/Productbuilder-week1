// ============================================================
// 계산 로직 모듈 (Pure Logic)
// ============================================================

/**
 * 문자열을 숫자로 안전하게 변환합니다.
 * @param {string|number} str - 변환할 문자열 또는 숫자
 * @returns {number} 파싱된 숫자 또는 0
 */
export const safeParseFloat = (str) => parseFloat(String(str || '').replace(/,/g, '')) || 0;

/**
 * [거래소 기준] 평단가 계산
 * 매수만 평균 단가에 반영하고, 매도는 수량만 차감합니다.
 * 
 * @param {number} initialQty - 초기 보유 수량
 * @param {number} initialAvgPrice - 초기 보유 평단가
 * @param {Array<{type: 'buy'|'sell', qty: number, price: number}>} transactions - 거래 내역 배열
 * @returns {{finalQty: number, finalCost: number, finalAvgPrice: number, totalBuyQty: number, totalBuyCost: number}}
 */
export function calculateExchangeMode(initialQty, initialAvgPrice, transactions) {
    let totalBuyQty = initialQty;
    let totalBuyCost = initialQty * initialAvgPrice;
    let totalSellQty = 0;

    transactions.forEach(tx => {
        if (tx.qty > 0 && tx.price >= 0) {
            if (tx.type === 'buy') {
                totalBuyQty += tx.qty;
                totalBuyCost += tx.qty * tx.price;
            } else {
                totalSellQty += tx.qty;
            }
        }
    });

    const avgBuyPrice = (totalBuyQty > 0) ? totalBuyCost / totalBuyQty : 0;
    let finalQty = totalBuyQty - totalSellQty;
    if (finalQty < 0) finalQty = 0;
    const finalCost = finalQty * avgBuyPrice;

    return {
        finalQty,
        finalCost,
        finalAvgPrice: avgBuyPrice,
        totalBuyQty,
        totalBuyCost
    };
}

/**
 * [지갑 기준] 평단가 계산
 * 매도 시 실현 손익을 투자금액에서 차감하여 평단가를 조정합니다.
 * 
 * @param {number} initialQty - 초기 보유 수량
 * @param {number} initialAvgPrice - 초기 보유 평단가
 * @param {Array<{type: 'buy'|'sell', qty: number, price: number}>} transactions - 거래 내역 배열
 * @returns {{finalQty: number, finalCost: number, finalAvgPrice: number}}
 */
export function calculateWalletMode(initialQty, initialAvgPrice, transactions) {
    let finalQty = initialQty;
    let finalCost = initialQty * initialAvgPrice;

    transactions.forEach(tx => {
        if (tx.qty > 0 && tx.price >= 0) {
            if (tx.type === 'buy') {
                finalCost += tx.qty * tx.price;
                finalQty += tx.qty;
            } else {
                if (finalQty > 0) {
                    // 매도 직전의 평균 단가
                    const avgPriceBeforeSell = finalCost / finalQty;
                    // 실현 손익 = (매도가 - 평단가) * 매도 수량
                    const profit = (tx.price - avgPriceBeforeSell) * Math.min(tx.qty, finalQty);

                    finalCost -= profit;
                    finalQty -= tx.qty;
                }
            }
        }
    });

    if (finalQty < 0) finalQty = 0;
    const finalAvgPrice = (finalQty > 0) ? finalCost / finalQty : 0;

    return {
        finalQty,
        finalCost,
        finalAvgPrice
    };
}

/**
 * What-if 평단가 계산
 * 
 * @param {number} currentTotalQty - 현재 총 매수 수량 (매도 미차감)
 * @param {number} currentTotalCost - 현재 총 매수 비용
 * @param {number} additionalAmount - 추가 매수 금액
 * @param {number} calculationPrice - 추가 매수 단가
 * @returns {{newAvgPrice: number, changePercent: number, direction: 'improvement'|'warning'|'neutral'}}
 */
export function calculateWhatIf(currentTotalQty, currentTotalCost, additionalAmount, calculationPrice) {
    if (additionalAmount <= 0 || calculationPrice <= 0) {
        return null;
    }

    const currentAvgPrice = (currentTotalQty > 0) ? currentTotalCost / currentTotalQty : 0;

    const additionalQty = additionalAmount / calculationPrice;
    const newTotalQty = currentTotalQty + additionalQty;
    const newTotalCost = currentTotalCost + additionalAmount;
    const newAvgPrice = (newTotalQty > 0) ? newTotalCost / newTotalQty : 0;

    let changePercent = 0;
    let direction = 'neutral';

    if (currentAvgPrice > 0) {
        changePercent = Math.abs(((newAvgPrice - currentAvgPrice) / currentAvgPrice) * 100);

        if (newAvgPrice < currentAvgPrice) {
            direction = 'improvement';
        } else if (newAvgPrice > currentAvgPrice) {
            direction = 'warning';
        }
    }

    return {
        newAvgPrice,
        changePercent,
        direction
    };
}

/**
 * 목표 평단가 달성 필요 수량 계산
 * 
 * @param {number} currentTotalQty - 현재 총 매수 수량
 * @param {number} currentTotalCost - 현재 총 매수 비용
 * @param {number} targetPrice - 목표 평단가
 * @param {number} calculationPrice - 추가 매수 단가
 * @returns {{requiredQty: number, requiredAmount: number, error: string|null}}
 */
export function calculateTargetRequiredQty(currentTotalQty, currentTotalCost, targetPrice, calculationPrice) {
    const currentAvgPrice = (currentTotalQty > 0) ? currentTotalCost / currentTotalQty : 0;

    if (currentTotalQty === 0 || currentTotalCost === 0) {
        return { requiredQty: 0, requiredAmount: 0, error: i18n.t('msg.no.quantity') };
    }

    if (currentAvgPrice <= calculationPrice) {
        return { requiredQty: 0, requiredAmount: 0, error: '현재 평단가가 계산 기준 가격보다 낮아 평단가를 더 낮출 수 없습니다.' };
    }

    if (targetPrice >= currentAvgPrice) {
        return { requiredQty: 0, requiredAmount: 0, error: i18n.t('msg.target.too.high') };
    }

    if (targetPrice <= calculationPrice) {
        return { requiredQty: 0, requiredAmount: 0, error: i18n.t('msg.target.below.calc') };
    }

    // 가중 평균 공식 역산
    // Target = (TotalCost + (Qty * CalcPrice)) / (TotalQty + Qty)
    // Target * (TotalQty + Qty) = TotalCost + (Qty * CalcPrice)
    // Target*TotalQty + Target*Qty = TotalCost + Qty*CalcPrice
    // Target*Qty - Qty*CalcPrice = TotalCost - Target*TotalQty
    // Qty * (Target - CalcPrice) = TotalCost - Target*TotalQty
    // Qty = (TotalCost - Target*TotalQty) / (Target - CalcPrice)
    // 분모 분자에 -1을 곱하면:
    // Qty = (Target*TotalQty - TotalCost) / (CalcPrice - Target) ... 이게 식이고

    // 코드 상의 식: (totalBuyQty * (currentAvgBuyPrice - targetPrice)) / (targetPrice - calcPrice)
    // 위 식을 풀어보면:
    // (Qty * Avg - Qty * Target) / (Target - Calc)
    // (TotalCost - Qty * Target) / (Target - Calc)
    // = -(Qty * Target - TotalCost) / (Target - Calc)
    // = (Qty * Target - TotalCost) / (Calc - Target)

    // 기존 공식: (totalBuyQty * (currentAvgBuyPrice - targetPrice)) / (targetPrice - calcPrice)
    // 분자: 양수 (Avg > Target)
    // 분모: 양수 (Target > Calc)

    const requiredQty = (currentTotalQty * (currentAvgPrice - targetPrice)) / (targetPrice - calculationPrice);

    if (requiredQty <= 0 || !isFinite(requiredQty)) {
        return { requiredQty: 0, requiredAmount: 0, error: '계산 불가' };
    }

    return {
        requiredQty,
        requiredAmount: requiredQty * calculationPrice,
        error: null
    };
}
