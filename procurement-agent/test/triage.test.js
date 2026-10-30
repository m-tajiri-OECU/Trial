import { test } from "node:test";
import assert from "node:assert/strict";
import { triage } from "../src/triage.js";
import { getBudgets, getRules, getStandardItems } from "../src/data.js";

const run = (input) => triage(input, getRules(), getStandardItems(), getBudgets());

test("標準品の少額依頼はサイト系になり、単価×数量で概算される", () => {
  const r = run({ text: "A4コピー用紙を5箱、研究室用", budgetCode: "JIM-2026-010" });
  assert.equal(r.route, "site");
  assert.equal(r.estimatedAmount, 14000);
  assert.equal(r.tier.label, "少額(10万円未満)");
  assert.deepEqual(r.warnings, []);
});

test("工事などのキーワードは金額に関わらず見積系", () => {
  const r = run({ text: "研究室のエアコン設置工事", amount: 800000 });
  assert.equal(r.route, "quote");
  assert.equal(r.tier.approvers.at(-1), "法人事務局長");
});

test("標準品でも金額が基準以上なら見積系", () => {
  const r = run({ text: "トナー 30個" });
  assert.equal(r.estimatedAmount, 375000);
  assert.equal(r.route, "quote");
});

test("判定できない依頼は要確認", () => {
  assert.equal(run({ text: "謎の物品", amount: 1000 }).route, "review");
});

test("予算超過と未入力項目を検出する", () => {
  const r = run({ text: "トナー 20個", budgetCode: "KEN-2026-001" });
  assert.ok(r.warnings.some((w) => w.includes("予算超過")));
  assert.ok(r.questions.includes("納品先(研究室・部署名)はどこですか?"));
});

test("存在しない予算科目コードを警告する", () => {
  assert.ok(run({ text: "ボールペン 2箱", budgetCode: "XXX" }).warnings.some((w) => w.includes("見つかりません")));
});
