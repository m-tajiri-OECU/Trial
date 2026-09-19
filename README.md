# OECU スキル共有ポータル

学校法人大阪電気通信大学(OECU)で、組織内に共有するAI業務支援スキルをカタログとして公開し、
管理者が公開対象スキルを設定変更できるようにするための社内ポータルです。

## 機能概要

- **スキル一覧・詳細(一般利用者向け)**
  - トップページ(`/`)で公開中のスキルをカテゴリ別に一覧表示
  - 各スキルの詳細ページ(`/skills/[id]`)で概要・利用手順・必要な入力・タグを確認可能
- **管理者設定(`/admin`)**
  - パスワード認証で保護
  - スキルごとに公開/非公開(有効/無効)を切り替え
  - スキル名・カテゴリ・担当部署・概要・詳細説明・利用手順・必要な入力・タグを編集
  - 変更は即座に一般利用者向け画面に反映される(サーバー再起動やビルド不要)
- **例規検索(`/reiki`)**
  - Google Driveの指定フォルダに保存されている例規JSON(kisoku-json-converterスキル等で
    e-Gov法令標準XMLスキーマ準拠に変換したもの)を一覧表示
  - 例規名・条文キーワードで全文検索し、該当条文の抜粋を表示
  - 検索結果から該当例規の詳細ページ(`/reiki/[fileId]`)に遷移し、条文単位で全文を閲覧

## 初期登録スキル

1. **例規整備支援**(法務・規程) — 学校法人の規則・規程・細則・要綱(例規)の点検、改正案・新旧対照表の作成支援
2. **契約書・申請書点検**(審査・点検) — 契約書や各種申請書の記載内容・様式・法令適合性の点検

管理者設定画面から、これら以外のスキルの追加・編集・公開/非公開の切り替えが行えます
(現時点では既存エントリの編集が中心。新規追加は `data/skills.json` への追記、または管理画面の拡張で対応してください)。

## セットアップ

```bash
npm install
npm run dev
```

`http://localhost:3000` でカタログ、`http://localhost:3000/admin` で管理者設定画面にアクセスできます。

### 管理者パスワード

環境変数 `ADMIN_PASSWORD` で管理者パスワードを設定してください(未設定時は開発用の初期値
`oecu-trial-2026` が使われます。本番運用前に必ず変更してください)。

```bash
# .env.local
ADMIN_PASSWORD=your-secure-password
ADMIN_SESSION_SECRET=your-random-secret
```

`ADMIN_SESSION_SECRET` はセッションCookieの署名に使う秘密文字列です。未設定時は開発用の
既定値が使われるため、本番運用前に必ず独自の値を設定してください。

### Google Drive連携(例規検索)

`/reiki` の例規検索機能は、Googleサービスアカウントを使ってDrive上の例規JSONを
読み取り専用で取得します。以下の環境変数を設定してください(いずれも未設定の場合、
`/reiki` は「未設定」の案内を表示します)。

```bash
# .env.local
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxxx@xxxx.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_REIKI_FOLDER_ID=例規JSONを格納しているGoogle DriveフォルダのID
```

事前準備:

1. Google Cloudでサービスアカウントを作成し、Drive APIを有効化してJSON形式の鍵をダウンロードする
2. 鍵ファイル内の `client_email` を `GOOGLE_SERVICE_ACCOUNT_EMAIL`、`private_key` を
   `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` に設定する(改行は `\n` のままでよい)
3. 例規JSONを格納しているGoogle Driveフォルダをサービスアカウントのメールアドレスへ
   「閲覧者」として共有し、フォルダIDを `GOOGLE_DRIVE_REIKI_FOLDER_ID` に設定する

## データ構造

スキル情報は `data/skills.json` に保存されます(`lib/types.ts` の `Skill` 型を参照)。
管理画面での変更はこのファイルへ直接書き込まれます。

例規JSONはGoogle Drive上のファイルをそのまま参照するため、このリポジトリ内には保存しません
(`lib/google-drive.ts` がDrive APIから取得、`lib/reiki.ts` が一覧・検索用に解析します)。

## 技術構成

- Next.js 16 (App Router) / React 18 / TypeScript
- Tailwind CSS
- ファイルベースの永続化(`data/skills.json`)、Cookieベースの簡易管理者認証

## ビルド・検証

```bash
npm run lint    # ESLint
npx tsc --noEmit  # 型チェック
npm run build   # 本番ビルド
```
