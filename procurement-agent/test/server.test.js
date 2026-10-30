import { test, after } from "node:test";
import assert from "node:assert/strict";
import { server } from "../src/server.js";

await new Promise((r) => server.listen(0, r));
after(() => server.close());
const base = () => `http://localhost:${server.address().port}`;
const post = (body) =>
  fetch(`${base()}/api/triage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

test("POST /api/triage は振り分け結果を返す", async () => {
  const res = await post({ text: "A4コピー用紙を5箱" });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.result.route, "site");
});

test("依頼内容が空なら400", async () => {
  assert.equal((await post({ text: " " })).status, 400);
});

test("画面と予算一覧を配信する", async () => {
  assert.equal((await fetch(base())).status, 200);
  assert.ok((await (await fetch(`${base()}/api/budgets`)).json()).budgets.length > 0);
});
