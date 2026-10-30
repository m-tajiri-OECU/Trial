const yen = (n) => `${n.toLocaleString("ja-JP")}円`;
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const list = (items) => `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;

fetch("/api/budgets").then((r) => r.json()).then(({ budgets }) => {
  for (const b of budgets) {
    const o = document.createElement("option");
    o.value = b.code;
    o.textContent = `${b.name}(${b.code})`;
    $("budget").appendChild(o);
  }
});

function render(r) {
  let html = `<section class="card"><span class="badge ${r.route}">${esc(r.routeLabel)}</span>${list(r.reasons)}`;
  if (r.estimatedAmount !== undefined) html += `<p>概算金額: <b>${yen(r.estimatedAmount)}</b></p>`;
  html += "</section>";
  if (r.warnings.length) html += `<section class="card warn"><h3>警告</h3>${list(r.warnings)}</section>`;
  if (r.tier) html += `<section class="card"><h3>承認ルート・必要な手続き(${esc(r.tier.label)})</h3><p>承認: ${r.tier.approvers.map(esc).join(" → ")}</p>${list(r.tier.procedures)}</section>`;
  if (r.budget) {
    html += `<section class="card"><h3>予算残高</h3><p>${esc(r.budget.account.name)}: 残額 ${yen(r.budget.remaining)}</p>`;
    if (r.budget.remainingAfter !== null) html += `<p>執行後の残額見込み: ${yen(r.budget.remainingAfter)}</p>`;
    html += "</section>";
  }
  if (r.questions.length) html += `<section class="card ask"><h3>確認したい事項</h3>${list(r.questions)}</section>`;
  $("result").innerHTML = html;
}

$("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("submit").disabled = true;
  $("error").textContent = "";
  try {
    const res = await fetch("/api/triage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(e.target).entries())),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error);
    render(data.result);
  } catch (err) {
    $("error").textContent = err.message;
  } finally {
    $("submit").disabled = false;
  }
});
