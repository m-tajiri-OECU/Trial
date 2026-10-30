import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { getBudgets, getRules, getStandardItems } from "./data.js";
import { triage } from "./triage.js";

const PORT = Number(process.env.PORT) || 3200;
const PUBLIC = new URL("../public/", import.meta.url);
const STATIC = {
  "/": ["index.html", "text/html; charset=utf-8"],
  "/app.js": ["app.js", "text/javascript; charset=utf-8"],
};

const num = (v) => {
  const n = typeof v === "number" ? v : typeof v === "string" && v !== "" ? Number(v) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};
const str = (v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : undefined);

function send(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type });
  res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

async function readJson(req) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 100_000) throw new Error("too large");
  }
  return JSON.parse(raw);
}

export const server = createServer(async (req, res) => {
  const { pathname } = new URL(req.url, "http://localhost");
  try {
    if (req.method === "GET" && STATIC[pathname]) {
      const [file, type] = STATIC[pathname];
      return send(res, 200, await readFile(new URL(file, PUBLIC)), type);
    }
    if (req.method === "GET" && pathname === "/api/budgets") {
      return send(res, 200, { ok: true, budgets: getBudgets() });
    }
    if (req.method === "POST" && pathname === "/api/triage") {
      const body = await readJson(req).catch(() => null);
      const text = str(body?.text);
      if (!text) return send(res, 400, { ok: false, error: "依頼内容を入力してください。" });
      const result = triage(
        {
          text,
          quantity: num(body.quantity),
          amount: num(body.amount),
          budgetCode: str(body.budgetCode),
          deliveryPlace: str(body.deliveryPlace),
          deadline: str(body.deadline),
        },
        getRules(),
        getStandardItems(),
        getBudgets()
      );
      return send(res, 200, { ok: true, result });
    }
    send(res, 404, { ok: false, error: "Not Found" });
  } catch (err) {
    console.error(err);
    send(res, 500, { ok: false, error: "サーバーエラーが発生しました。" });
  }
});

if (process.argv[1] === new URL(import.meta.url).pathname) {
  server.listen(PORT, () => console.log(`procurement-agent: http://localhost:${PORT}`));
}
