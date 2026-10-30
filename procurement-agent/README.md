# OECU 購買エージェント

依頼の受付から検収・支払連携までを支える購買エージェントの試作です。
スキル共有ポータル(リポジトリ直下のNext.jsアプリ)とは独立した、依存パッケージなしのNode.jsアプリです。

原則: **エージェントは「準備と提案」まで。発注の確定・承認は人が行う。**

## 現在の機能(第1段階)

- 自然文の依頼を受け、サイト系/見積系/要確認に振り分け
- 金額別の承認ルートと必要手続きの提示
- 予算残高の確認と、超過・消化率超過の警告
- 不足情報(予算科目・納品先・納期・数量・金額)の質問

進め方は [docs/roadmap.md](docs/roadmap.md) を参照してください。

## 使い方

Node.js 20以上が必要です。`npm install` は不要です。

```bash
cd procurement-agent
npm start        # http://localhost:3200 (PORTで変更可)
npm test         # node:test
```

## 構成

- `src/triage.js` 判定ロジック(純関数。LLM化する場合もI/Fを維持して差し替え)
- `src/server.js` HTTPサーバー(`POST /api/triage`, `GET /api/budgets`)
- `data/` 金額基準・標準品・予算(**仮置きのダミー値**。実際の会計規程に合わせて置き換え)
- `public/` 画面
