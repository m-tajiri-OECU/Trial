import { getBudgets } from "@/lib/procurement/data";
import RequestForm from "./request-form";

export const dynamic = "force-dynamic";

export default function ProcurementPage() {
  const budgets = getBudgets();
  return (
    <div>
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-bold text-oecu-navy">購買依頼(試作)</h1>
        <p className="text-sm text-slate-600">
          依頼内容を入力すると、サイト系/見積系の振り分け、必要な手続き、承認ルート、予算の警告を提案します。
          エージェントは準備と提案までを行い、発注の確定と承認は人が行います。
        </p>
        <p className="mt-2 rounded bg-amber-50 px-3 py-2 text-xs text-amber-800">
          金額基準・承認ルート・予算データは仮置きのダミー値です(data/procurement/)。
        </p>
      </div>
      <RequestForm budgets={budgets} />
    </div>
  );
}
