import { NextRequest, NextResponse } from "next/server";
import { getBudgets, getRules, getStandardItems } from "@/lib/procurement/data";
import { triage } from "@/lib/procurement/triage";
import type { RequestInput } from "@/lib/procurement/types";

const num = (v: unknown): number | undefined => {
  const n = typeof v === "number" ? v : typeof v === "string" && v !== "" ? Number(v) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};
const str = (v: unknown): string | undefined =>
  typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const text = str(body?.text);
  if (!text) {
    return NextResponse.json({ ok: false, error: "依頼内容を入力してください。" }, { status: 400 });
  }
  const input: RequestInput = {
    text,
    quantity: num(body.quantity),
    amount: num(body.amount),
    budgetCode: str(body.budgetCode),
    deliveryPlace: str(body.deliveryPlace),
    deadline: str(body.deadline),
  };
  const result = triage(input, getRules(), getStandardItems(), getBudgets());
  return NextResponse.json({ ok: true, result });
}
