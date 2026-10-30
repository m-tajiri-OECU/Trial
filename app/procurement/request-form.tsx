"use client";

import { useState } from "react";
import type { BudgetAccount, TriageResult } from "@/lib/procurement/types";

const yen = (n: number) => `${n.toLocaleString("ja-JP")}円`;
const field = "w-full rounded border border-slate-300 px-3 py-2 text-sm";

export default function RequestForm({ budgets }: { budgets: BudgetAccount[] }) {
  const [result, setResult] = useState<TriageResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const body = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch("/api/procurement/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setResult(data.result);
    } catch (err) {
      setResult(null);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const routeColor = { site: "bg-oecu-mint text-oecu-navy", quote: "bg-sky-100 text-sky-900", review: "bg-amber-100 text-amber-900" };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">依頼内容(自然文)</span>
          <textarea name="text" required rows={3} className={field} placeholder="例:A4コピー用紙を5箱、研究室用" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">数量</span>
            <input name="quantity" type="number" min={0} className={field} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">概算金額(円)</span>
            <input name="amount" type="number" min={0} className={field} />
          </label>
        </div>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">予算科目</span>
          <select name="budgetCode" className={field} defaultValue="">
            <option value="">(未選択)</option>
            {budgets.map((b) => (
              <option key={b.code} value={b.code}>{b.name}({b.code})</option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">納品先</span>
            <input name="deliveryPlace" className={field} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">希望納期</span>
            <input name="deadline" type="date" className={field} />
          </label>
        </div>
        <button disabled={loading} className="rounded bg-oecu-teal px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {loading ? "判定中…" : "振り分けを提案する"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      <div className="space-y-4">
        {!result ? (
          <p className="text-sm text-slate-500">依頼を入力すると、ここに提案が表示されます。</p>
        ) : (
          <>
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${routeColor[result.route]}`}>
                {result.routeLabel}
              </span>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {result.reasons.map((r) => <li key={r}>{r}</li>)}
              </ul>
              {result.estimatedAmount !== undefined && (
                <p className="mt-3 text-sm">概算金額: <b>{yen(result.estimatedAmount)}</b></p>
              )}
            </section>

            {result.warnings.length > 0 && (
              <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <h3 className="mb-1 font-semibold">警告</h3>
                <ul className="list-disc pl-5">{result.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
              </section>
            )}

            {result.tier && (
              <section className="rounded-lg border border-slate-200 bg-white p-5 text-sm shadow-sm">
                <h3 className="mb-2 font-semibold text-oecu-navy">承認ルート・必要な手続き({result.tier.label})</h3>
                <p className="mb-2">承認: {result.tier.approvers.join(" → ")}</p>
                <ul className="list-disc pl-5">{result.tier.procedures.map((p) => <li key={p}>{p}</li>)}</ul>
              </section>
            )}

            {result.budget && (
              <section className="rounded-lg border border-slate-200 bg-white p-5 text-sm shadow-sm">
                <h3 className="mb-2 font-semibold text-oecu-navy">予算残高</h3>
                <p>{result.budget.account.name}: 残額 {yen(result.budget.remaining)}</p>
                {result.budget.remainingAfter !== null && <p>執行後の残額見込み: {yen(result.budget.remainingAfter)}</p>}
              </section>
            )}

            {result.questions.length > 0 && (
              <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                <h3 className="mb-1 font-semibold">確認したい事項</h3>
                <ul className="list-disc pl-5">{result.questions.map((q) => <li key={q}>{q}</li>)}</ul>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
