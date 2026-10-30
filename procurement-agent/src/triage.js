const yen = (n) => `${n.toLocaleString("ja-JP")}円`;

/** 自然文から「5箱」「3台」のような数量を拾う(フォーム入力がなければ補助的に使う) */
function parseQuantity(text) {
  const m = text.match(/(\d+)\s*(箱|個|台|本|冊|セット|枚|式)/);
  return m ? Number(m[1]) : undefined;
}

function pickTier(rules, amount) {
  return (
    rules.tiers.find((t) => t.under === null || amount < t.under) ??
    rules.tiers[rules.tiers.length - 1]
  );
}

const ROUTE_LABELS = {
  site: "サイト系(標準消耗品)",
  quote: "見積系(個別発注)",
  review: "要確認(担当者判定)",
};

/**
 * 依頼の振り分け(ルールベース)。
 * エージェントの役割は「準備と提案」まで。発注確定・承認は人が行う。
 * 将来LLMで品目抽出を行う場合も、この関数のI/Fを維持して差し替える。
 *
 * @param {{text:string, quantity?:number, amount?:number, budgetCode?:string, deliveryPlace?:string, deadline?:string}} input
 */
export function triage(input, rules, items, budgets) {
  const text = input.text.trim();
  const warnings = [];
  const questions = [];
  const reasons = [];

  const matchedItem = items.find((i) => i.keywords.some((k) => text.includes(k)));
  const quantity = input.quantity ?? parseQuantity(text);

  let estimatedAmount = input.amount;
  if (estimatedAmount === undefined && matchedItem && quantity) {
    estimatedAmount = matchedItem.unitPrice * quantity;
    reasons.push(
      `標準品「${matchedItem.name}」の単価${yen(matchedItem.unitPrice)}×${quantity}で概算${yen(estimatedAmount)}`
    );
  }

  // --- 振り分け ---
  const hitKeywords = rules.quoteKeywords.filter((k) => text.includes(k));
  let route;
  if (hitKeywords.length > 0) {
    route = "quote";
    reasons.push(`個別仕様になりやすいキーワード(${hitKeywords.join("・")})を含む`);
  } else if (estimatedAmount !== undefined && estimatedAmount >= rules.quoteThreshold) {
    route = "quote";
    reasons.push(`概算${yen(estimatedAmount)}が見積系の基準(${yen(rules.quoteThreshold)})以上`);
  } else if (matchedItem) {
    route = "site";
    reasons.push(`標準品リストに該当(${matchedItem.name}${matchedItem.recommended ? "・推奨品" : ""})`);
  } else {
    route = "review";
    reasons.push("標準品・見積対象のどちらにも判定できないため、発注担当者が確認");
  }

  // --- 手続き・承認ルート ---
  const tier = estimatedAmount !== undefined ? pickTier(rules, estimatedAmount) : undefined;

  // --- 予算 ---
  let budget;
  if (input.budgetCode) {
    const account = budgets.find((b) => b.code === input.budgetCode);
    if (account) {
      const remaining = account.annual - account.executed;
      const remainingAfter = estimatedAmount !== undefined ? remaining - estimatedAmount : null;
      budget = { account, remaining, remainingAfter };
      if (remainingAfter !== null && remainingAfter < 0) {
        warnings.push(`予算超過の見込み: 残額${yen(remaining)}に対し概算${yen(estimatedAmount)}`);
      } else if ((account.executed + (estimatedAmount ?? 0)) / account.annual > rules.budgetCautionRatio) {
        warnings.push(`執行後の消化率が${Math.round(rules.budgetCautionRatio * 100)}%を超える見込みです`);
      }
    } else {
      warnings.push(`予算科目コード「${input.budgetCode}」が見つかりません`);
    }
  }

  // --- 不足情報(対話補完) ---
  if (!input.budgetCode) questions.push("予算科目はどれを使いますか?");
  if (!input.deliveryPlace) questions.push("納品先(研究室・部署名)はどこですか?");
  if (!input.deadline) questions.push("希望納期はいつですか?");
  if (!quantity) questions.push("数量を教えてください。");
  if (estimatedAmount === undefined) questions.push("概算金額(わかる範囲)を教えてください。承認ルートの判定に必要です。");

  return { route, routeLabel: ROUTE_LABELS[route], reasons, matchedItem, quantity, estimatedAmount, tier, budget, warnings, questions };
}
