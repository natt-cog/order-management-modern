/**
 * O11 OrderManagement_CS の Application_Bootstrap を再現するシード。
 * 入力: data/outsystems-resources/*.xlsx, ProductPictures.zip（O11 MCP getResource で取得した Bootstrap リソース）
 */
import path from "node:path";
import AdmZip from "adm-zip";
import bcrypt from "bcryptjs";
import * as XLSX from "xlsx";
import { sql as pg } from "drizzle-orm";
import { db, sql } from "../src/db";
import * as s from "../src/db/schema";
import { amountOf, nextCode } from "../src/lib/rules";

const RES = path.join(process.cwd(), "data", "outsystems-resources");
type Row = Record<string, unknown>;
const sheet = (file: string, name?: string): Row[] => {
  const wb = XLSX.readFile(path.join(RES, file), { cellDates: true });
  return XLSX.utils.sheet_to_json<Row>(wb.Sheets[name ?? wb.SheetNames[0]], { defval: null });
};
const str = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim());
const optStr = (v: unknown) => (str(v) === "" ? null : str(v));
const num = (v: unknown) => (v === null || v === undefined || v === "" ? null : String(v));
const lower = (v: unknown) => str(v).toLowerCase();

async function main() {
  await db.execute(pg`TRUNCATE order_item, "order", opportunity, product_picture, product_feature, product, product_category,
    model, brand, account, country, user_roles, users, site_properties, order_status, opportunity_stage, opportunity_type RESTART IDENTITY CASCADE`);

  // Static entities [MCP: getDataModel]
  await db.insert(s.orderStatuses).values([
    { id: 1, identifier: "Draft", label: "Draft", order: 1, description: null, iconName: "file-text-o", colorRgb: "rgba(144,164,174 ,1)" },
    { id: 2, identifier: "Submitted", label: "Submitted", order: 2, description: "Submitted.", iconName: "download", colorRgb: "rgb(228,175,5)" },
    { id: 3, identifier: "Closed", label: "Approved & Closed", order: 3, description: "The order was closed.", iconName: "times", colorRgb: "rgb(216,42,39)" },
    { id: 4, identifier: "Rejected", label: "Rejected", order: 4, description: "The order was rejected.", iconName: "eraser", colorRgb: "rgb(234,140,138)" },
  ]);
  await db.insert(s.opportunityTypes).values([
    { id: 1, identifier: "NewBusiness", label: "New business", order: 1 },
    { id: 2, identifier: "ExistingBusiness", label: "Existing business", order: 2 },
  ]);
  await db.insert(s.opportunityStages).values([
    { id: 1, identifier: "Prospecting", label: "Prospecting", order: 1 },
    { id: 2, identifier: "Investigation", label: "Investigation", order: 2 },
    { id: 3, identifier: "ProposalMade", label: "Proposal made", order: 3 },
    { id: 4, identifier: "Negotiation", label: "Negotiation", order: 4 },
    { id: 5, identifier: "ClosedWon", label: "Closed won", order: 5 },
    { id: 6, identifier: "ClosedLost", label: "Closed lost", order: 6 },
  ]);
  // Site properties [MCP: runQuery SiteProperties]
  await db.insert(s.siteProperties).values([
    { name: "Dashboard_PersonalGoal", value: "50000" },
    { name: "Dashboard_TeamGoalPercent", value: "54" },
    { name: "Dashboard_TargetValue", value: "10000" },
    { name: "Currency", value: "€" },
    { name: "DecimalSeparator", value: "." },
    { name: "GroupSeparator", value: "," },
  ]);

  // User_Bootstrap [MCP]
  const hash = await bcrypt.hash("outsystems", 10);
  const [manuel, ana, jose] = await db.insert(s.users).values([
    { name: "Manuel Luís", username: "manuel.luis@observeverything.example", email: "manuel.luis@observeverything.example", passwordHash: hash },
    { name: "Ana Martins", username: "ana.martins@observeverything.example", email: "ana.martins@observeverything.example", passwordHash: hash },
    { name: "José Felix", username: "jose.felix@observeverything.example", email: "jose.felix@observeverything.example", passwordHash: hash },
  ]).returning();
  await db.insert(s.userRoles).values([
    { userId: manuel.id, role: "OrderRepresentative" },
    { userId: ana.id, role: "OrderRepresentative" },
    { userId: jose.id, role: "OrderManager" },
  ]);
  const admin = jose.id;
  const now = new Date();
  const auditBy = (u: number) => ({ createdBy: u, createdOn: now, updatedBy: u, updatedOn: now });

  // Country_Bootstrap
  const countryRows = sheet("Countries.xlsx").filter((r) => str(r.Code));
  const countries = await db.insert(s.countries).values(countryRows.map((r) => ({ code: str(r.Code), name: str(r.Label), ...auditBy(admin) }))).returning();
  const countryByCode = new Map(countries.map((c) => [c.code.toLowerCase(), c.id]));

  // Brand / Model
  const brandRows = sheet("Products.xlsx", "ProductBrand").filter((r) => str(r.BrandName));
  const brands = await db.insert(s.brands).values(brandRows.map((r) => ({ name: str(r.BrandName), ...auditBy(admin) }))).returning();
  const brandByName = new Map(brands.map((b) => [b.name.toLowerCase(), b.id]));
  const modelRows = sheet("Products.xlsx", "ProductModel").filter((r) => str(r.Model));
  const modelKey = new Map<string, number>();
  for (const r of modelRows) {
    const brandId = brandByName.get(lower(r.BrandName));
    if (!brandId) continue;
    const [m] = await db.insert(s.models).values({ name: str(r.Model), brandId, ...auditBy(admin) }).returning();
    modelKey.set(lower(r.ProductName), m.id);
  }

  // Category_Bootstrap → ProductCategory_GenerateCode
  const catRows = sheet("Categories.xlsx").filter((r) => str(r.Name));
  const cats: { id: number; name: string }[] = [];
  let lastCat: string | null = null;
  for (const r of catRows) {
    lastCat = nextCode("C", lastCat);
    const [c] = await db.insert(s.productCategories).values({ code: lastCat, name: str(r.Name), description: optStr(r.Description), ...auditBy(admin) }).returning();
    cats.push(c);
  }
  const catByName = new Map(cats.map((c) => [c.name.toLowerCase(), c.id]));

  // Product_Bootstrap（名称・説明は ToLower(Trim()) で登録される）
  const prodRows = sheet("Products.xlsx", "Products").filter((r) => str(r.Name));
  const prodByName = new Map<string, number>();
  const prodByCode = new Map<string, { id: number; price: string }>();
  let lastProd: string | null = null;
  for (const r of prodRows) {
    const categoryId = catByName.get(lower(r.Category));
    if (!categoryId) continue;
    lastProd = nextCode("P", lastProd);
    const [p] = await db.insert(s.products).values({
      code: lastProd, name: lower(r.Name), description: lower(r.Description), categoryId,
      modelId: modelKey.get(lower(r.Name)) ?? null, price: String(r.Price ?? 0), discount: num(r.Discount),
      stock: r.Stock === null ? null : Number(r.Stock), reference: optStr(r.Reference === null ? null : Math.round(Number(r.Reference))),
      ean: optStr(r.EAN === null ? null : Math.round(Number(r.EAN))), weight: optStr(r.Weight), dimensions: optStr(r.Dimensions),
      ...auditBy(admin),
    }).returning();
    prodByName.set(p.name, p.id);
    prodByCode.set(p.code.toLowerCase(), { id: p.id, price: p.price });
  }
  const featRows = sheet("Products.xlsx", "ProductFeature").filter((r) => str(r.ProductName) && str(r.Feature));
  const feats = featRows.flatMap((r) => {
    const productId = prodByName.get(lower(r.ProductName));
    return productId ? [{ productId, description: str(r.Feature).slice(0, 100), ...auditBy(admin) }] : [];
  });
  if (feats.length) await db.insert(s.productFeatures).values(feats);
  const zip = new AdmZip(path.join(RES, "ProductPictures.zip"));
  for (const e of zip.getEntries()) {
    const n = parseInt(e.entryName.replace(".jpg", ""), 10);
    const p = prodByCode.get(`p${String(n).padStart(4, "0")}`);
    if (!p) continue;
    await db.insert(s.productPictures).values({ productId: p.id, filename: e.entryName, filetype: "image/jpeg", file: e.getData(), isCover: true, ...auditBy(admin) });
  }

  // Account_Bootstrap → Account_GenerateCode
  const accByCode = new Map<string, number>();
  let lastAcc: string | null = null;
  for (const r of sheet("Accounts.xlsx").filter((x) => str(x.Company))) {
    lastAcc = nextCode("A", lastAcc);
    const [a] = await db.insert(s.accounts).values({
      code: lastAcc, company: str(r.Company), contact: str(r.Contact), countryId: countryByCode.get(lower(r.Country)) ?? null,
      address: optStr(r.Address), city: optStr(r.City), postalCode: optStr(r.PostalCode), phone: optStr(r.Phone), email: optStr(r.Email),
      ...auditBy(admin),
    }).returning();
    accByCode.set(a.code.toLowerCase(), a.id);
  }

  // Opportunity_Bootstrap（作成者は EntryOrderUserId = Manager）
  const typeByLabel = new Map([["new business", 1], ["existing business", 2]]);
  const stageByLabel = new Map([["prospecting", 1], ["investigation", 2], ["proposal made", 3], ["negotiation", 4], ["closed won", 5], ["closed lost", 6]]);
  const oppByName = new Map<string, number>();
  for (const r of sheet("Opportunities.xlsx").filter((x) => str(x.Name))) {
    const accountId = accByCode.get(lower(r.Account));
    const t = typeByLabel.get(lower(r.Type));
    const st = stageByLabel.get(lower(r.Stage));
    if (!accountId || !t || !st) continue;
    const [o] = await db.insert(s.opportunities).values({
      accountId, name: str(r.Name), description: optStr(r.Description), opportunityTypeId: t, opportunityStageId: st,
      amount: num(r.Amount), probability: num(r.Probability), expectedRevenue: num(r.ExpectedRevenue),
      closeOn: r.CloseOn instanceof Date ? r.CloseOn : null, ...auditBy(admin),
    }).returning();
    oppByName.set(o.name.toLowerCase(), o.id);
  }

  // Order_Bootstrap: 新規注文は Order_Save_BOOTSTRAP でコード再採番・Draft 固定、担当者は Manuel/Ana を交互に割当
  let currentCode = "";
  let orderId = 0;
  let changeSalesRep = false;
  let lastOrd: string | null = null;
  const ymd = (d: unknown) => (d instanceof Date ? d.toISOString().slice(0, 10) : null);
  for (const r of sheet("Orders.xlsx").filter((x) => str(x.Code))) {
    changeSalesRep = !changeSalesRep; // O11 は明細行ごとにトグル（注文の担当者は先頭行時点の値）
    if (str(r.Code) !== currentCode || currentCode === "") {
      currentCode = str(r.Code);
      orderId = 0;
      const by = changeSalesRep ? ana.id : manuel.id;
      const accountId = accByCode.get(lower(r.Account));
      if (!accountId) continue;
      lastOrd = nextCode("ORD", lastOrd);
      const [o] = await db.insert(s.orders).values({
        code: lastOrd, accountId, opportunityId: oppByName.get(lower(r.Opportunity)) ?? null, totalAmount: "0", orderStatusId: 1,
        expectedClosedOn: ymd(r.ExpectedClosedOn), requiredOn: r.RequiredOn instanceof Date ? r.RequiredOn : null,
        shippedOn: r.ShippedOn instanceof Date ? r.ShippedOn : null, ...auditBy(by),
      }).returning();
      orderId = o.id;
    }
    const p = prodByCode.get(lower(r.Product));
    if (!p || !orderId) continue;
    const by = changeSalesRep ? ana.id : manuel.id;
    const qty = Number(r.Quantity);
    const disc = Number(r.Discount ?? 0);
    await db.insert(s.orderItems).values({ orderId, productId: p.id, quantity: qty, discount: String(disc), amount: amountOf(Number(p.price), qty, disc).toFixed(8), ...auditBy(by) });
    await db.execute(pg`UPDATE "order" SET total_amount = (SELECT COALESCE(SUM(amount),0) FROM order_item WHERE order_id = ${orderId} AND is_active) WHERE id = ${orderId}`);
  }

  const counts = await db.execute(pg`SELECT (SELECT count(*) FROM product) products, (SELECT count(*) FROM account) accounts,
    (SELECT count(*) FROM opportunity) opportunities, (SELECT count(*) FROM "order") orders, (SELECT count(*) FROM order_item) items,
    (SELECT count(*) FROM product_picture) pictures, (SELECT count(*) FROM country) countries`);
  console.log(counts[0]);
  await sql.end();
}

main().catch(async (e) => { console.error(e); await sql.end(); process.exit(1); });
