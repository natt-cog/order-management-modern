# OrderManagement（O11）移行仕様と対応表

抽出元：Service Studio 11.55.91 内蔵 O11 MCP（`http://127.0.0.1:41820/mcp`）。`getDataModel` / `getScreenNames` / `getScreen` / `getActionNames` / `getServerAction` / `getClientAction` / `getRoleNames` / `getResourceNames` / `getResource` などで 117 オブジェクトを取得しました。生の抽出結果は `mcp-dump/` にあります（C# Model API 形式、既定値を除去済み）。

## 1. 判定

**移行可能（設計図はほぼ完全に取得できる）**。ただし実行時の DB データは MCP から読めません（`runQuery` はモデルに対する ModelQL です）。今回は、モジュールに同梱された Bootstrap 用 Resources（xlsx / zip）を `getResource` で取り出し、初期データとして使いました。本番データを移すには、DB 直結やエクスポートなど別の手段が必要です。

## 2. エンティティ対応

| OutSystems（OrderManagement_CS） | PostgreSQL テーブル | 備考 |
| --- | --- | --- |
| Account | `account` | `Code` は一意（A0001…） |
| Country | `country` | Countries.xlsx（220 件） |
| Brand / Model | `brand` / `model` | Products.xlsx の ProductBrand / ProductModel シート |
| ProductCategory | `product_category` | |
| Product | `product` | `ReorderLevel` は O11 MCP の書き込みテストで追加した属性 |
| ProductFeature / ProductPicture | `product_feature` / `product_picture` | 画像は `bytea`（ProductPictures.zip の 28 枚） |
| Opportunity | `opportunity` | `Name` は一意 |
| Order / OrderItem | `order` / `order_item` | FK は Delete Rule = Protect → `ON DELETE RESTRICT` |
| OrderStatus / OpportunityStage / OpportunityType（Static） | `order_status` / `opportunity_stage` / `opportunity_type` | Id・Label・Order を同じ値で保持 |
| Users + Role（OrderManager / OrderRepresentative） | `users.role` | Auth.js で認証 |

## 3. ロジック対応

| OutSystems | 移行先 | 内容 |
| --- | --- | --- |
| `Order_Validate` ほか `*_Validate` | `src/lib/validation.ts` | エラーメッセージは原文のまま |
| `Order_GenerateCode` | `src/lib/orders.ts` `nextOrderCode` | ORD0001 形式の連番 |
| `OrderItem_Save` の Amount 計算 | `lineAmount` | `Price × Qty − Price × Qty × Discount / 100` |
| `Order_Save` / `UpdateOrderAmount` | `order-service.ts` `saveOrder` / `recomputeTotal` | 合計は有効な明細の合計 |
| `SaveOrderItemandUpdateStock` / `UpdateProductStock` | `saveOrderItem` | 在庫を数量の差分だけ増減。在庫不足は "Insufficient stock to fulfill your order" |
| `UpdateStockOnOrderDelete` | `deleteOrder` / `deleteOrderItem` | 削除時に在庫を戻す |
| `CheckOrderManagerRole` / `CheckOrderRepresentativeRole` | `src/lib/permissions.ts` / `session.ts` | 承認・却下とマネージャー用ダッシュボードは OrderManager のみ |
| `Dashboard_GetHistory` / `Dashboard_GetByCategory` | `src/lib/dashboard.ts` | 月別・カテゴリ別の売上 |
| `SiteProperty_GetDashboard` / `GetCurrency` | `SITE` 定数 / `money()` | 目標 50,000 €、チーム目標 54% |

## 4. 画面対応

| OutSystems 画面 | ルート |
| --- | --- |
| Login（Sample Users） | `/login` |
| Dashboard / DashboardManager | `/dashboard` / `/dashboard-manager` |
| Orders / OrderDetail | `/orders` / `/orders/[id]` |
| Invoices | `/invoices`（Approved & Closed の注文） |
| Products / ProductDetail | `/products` / `/products/[id]` |
| Accounts / AccountShow / AccountEdit | `/accounts` / `/accounts/[id]` / `/accounts/[id]/edit` |
| Opportunities / OpportunityDetail | `/opportunities` / `/opportunities/[id]` |
| InvalidPermissions | `/invalid-permissions` |
| Splash | 不要（`/` からロールに応じてリダイレクト） |

## 5. OutSystems との差異・既知の注意点

- **元アプリの癖をそのまま残した点**：`Account_Validate` は Contact が空のときに "Code is required" を、Code が重複したときに "Company name must be unique" を出します。`Opportunity_Validate` の "leaser" という誤字も原文のままです。
- **データの不整合**：Orders.xlsx の商談番号は `OPP001` 形式、Opportunities.xlsx は `OPP0001` 形式です。seed では番号部分で照合しています。Accounts.xlsx は Phone / Email の列がずれています（元データのまま）。
- **UI**：OutSystems UI のウィジェット（スライダーやチャート）は、数値入力と CSS のバーで置き換えました。見た目は同じではありません。
- **ステータス遷移**：営業担当は Draft → Submitted、マネージャーは Submitted → Approved & Closed / Rejected。Draft 以外の注文は明細を編集できません。
- **未移行**：ユーザー管理画面（OutSystems の Users アプリ）、商品画像のアップロード UI、多言語化。
