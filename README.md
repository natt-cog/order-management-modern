# Order Management Modern（OutSystems 11 → Next.js 移行）

OutSystems 11 のサンプルアプリ **Order Management**（`OrderManagement` / `OrderManagement_CS`）を、Service Studio 内蔵の **O11 MCP** で読み取り、OutSystems の外（Next.js + PostgreSQL）に作り直したリポジトリです。

## 技術スタック

| 層 | OutSystems 11 | 移行後 |
| --- | --- | --- |
| UI | Reactive Web（Screens / Blocks） | Next.js 15 App Router + React 19 + Tailwind CSS 4 |
| ロジック | Server / Client Actions | Server Actions + `src/lib/*.ts` |
| データ | Entities / Static Entities（SQL Server） | PostgreSQL + Drizzle ORM |
| 認証・ロール | Users + `OrderManager` / `OrderRepresentative` | Auth.js（Credentials, JWT）+ 同じロール名 |
| 初期データ | `*_Bootstrap` + Resources（xlsx / zip） | `scripts/seed.ts`（同じ xlsx / 画像を使用） |

## セットアップ

```bash
corepack enable && corepack prepare pnpm@9.15.9 --activate
pnpm install
cp .env.example .env            # DATABASE_URL などを環境に合わせて変更
pnpm db:migrate && pnpm db:seed
pnpm dev                        # http://localhost:3000
```

`ENABLE_SAMPLE_LOGIN=true` のとき、ログイン画面に OutSystems 版と同じ「Sample Users」が出ます（パスワードは `src/lib/sample-users.ts`）。

| ユーザー | ロール |
| --- | --- |
| Manuel Luís / Ana Martins | OrderRepresentative（営業担当） |
| José Felix | OrderManager（営業マネージャー：承認・却下、マネージャー用ダッシュボード） |

## テスト

```bash
pnpm lint && pnpm typecheck && pnpm test      # 単体テスト（検証ロジック・注文番号・金額計算・ロール）
pnpm test:e2e                                 # Playwright（BASE_URL を指定すると既存サーバーを利用）
```

## ディレクトリ

- `docs/outsystems-spec/` … O11 MCP から抽出した仕様（`MIGRATION.md` に対応表、`mcp-dump/` に生の抽出結果）
- `data/outsystems-resources/`, `data/product-pictures/` … OutSystems モジュールの Resources から取り出した初期データ
- `src/db/schema.ts` … エンティティ定義（`OrderManagement_CS` の getDataModel を移植）
- `src/lib/validation.ts`, `src/lib/order-service.ts` … `*_Validate`、`Order_Save`、在庫更新ロジックの移植
