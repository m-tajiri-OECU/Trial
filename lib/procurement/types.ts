export interface StandardItem {
  id: string;
  name: string;
  keywords: string[];
  unit: string;
  unitPrice: number;
  vendor: string;
  recommended: boolean;
}

export interface BudgetAccount {
  code: string;
  name: string;
  department: string;
  annual: number;
  executed: number;
}

export interface ApprovalTier {
  /** この金額未満に適用(円)。最終段は null(上限なし) */
  under: number | null;
  label: string;
  approvers: string[];
  procedures: string[];
}

export interface ProcurementRules {
  /** 見積系に回す金額の下限(円) */
  quoteThreshold: number;
  /** 見積系に回すキーワード(工事・保守など個別仕様になりやすい案件) */
  quoteKeywords: string[];
  /** 予算消化率がこの値を超えたら注意喚起 */
  budgetCautionRatio: number;
  tiers: ApprovalTier[];
}

export interface RequestInput {
  text: string;
  quantity?: number;
  amount?: number;
  budgetCode?: string;
  deliveryPlace?: string;
  deadline?: string;
}

export type Route = "site" | "quote" | "review";

export interface TriageResult {
  route: Route;
  routeLabel: string;
  reasons: string[];
  matchedItem?: StandardItem;
  quantity?: number;
  estimatedAmount?: number;
  tier?: ApprovalTier;
  budget?: {
    account: BudgetAccount;
    remaining: number;
    remainingAfter: number | null;
  };
  warnings: string[];
  /** 対話で補完すべき不足情報 */
  questions: string[];
}
