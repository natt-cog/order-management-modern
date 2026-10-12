import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import ExcelJS from "exceljs";
import { sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { SAMPLE_PASSWORD, SAMPLE_USERS } from "@/lib/sample-users";
import { generateCode, lineAmount } from "@/lib/orders";

// Port of OrderManagement_CS *_Bootstrap actions; data = resources read via O11 MCP getResource.
const RES = path.join(process.cwd(), "data", "outsystems-resources");
const PICS = path.join(process.cwd(), "data", "product-pictures");

async function sheet(file: string, name?: string) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.join(RES, file));
  const ws = name ? wb.getWorksheet(name)! : wb.worksheets[0];
  const header = (ws.getRow(1).values as unknown[]).slice(1).map((v) => String(v ?? "").trim());
  const rows: Record<string, unknown>[] = [];
  ws.eachRow((row, i) => {
    if (i === 1) return;
    const vals = (row.values as unknown[]).slice(1);
    if (!vals.some((v) => v !== null && v !== undefined && v !== "")) return;
    rows.push(Object.fromEntries(header.map((h, j) => [h, cell(vals[j])])));
  });
  return rows;
}
function cell(v: unknown): unknown {
  if (v && typeof v === "object" && "result" in v) return (v as { result: unknown }).result;
  if (v && typeof v === "object" && "richText" in v) return (v as { richText: { text: string }[] }).richText.map((t) => t.text).join("");
  return v;
}
const str = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim());
const num = (v: unknown) => (v === null || v === undefined || v === "" ? 0 : Number(v));
const dt = (v: unknown) => (v instanceof Date ? v : v ? new Date(String(v)) : null);
const pad = (prefix: string, n: number) => prefix + String(n).padStart(4, "0");

async function main() {
  await db.execute(sql`TRUNCATE order_item, "order", opportunity, product_picture, product_feature, product, model, brand, product_category, account, country, opportunity_type, opportunity_stage, order_status, users RESTART IDENTITY CASCADE`);

  const hash = await bcrypt.hash(SAMPLE_PASSWORD, 10);
  const users = await db.insert(schema.users).values(SAMPLE_USERS.map((u) => ({ username: u.username, name: u.name, role: u.role, passwordHash: hash }))).returning();
  const admin = users.find((u) => u.role === "OrderManager")!.id;
  const reps = users.filter((u) => u.role === "OrderRepresentative").map((u) => u.id);

  await db.insert(schema.orderStatuses).values([
    { id: 1, identifier: "Draft", label: "Draft", order: 1, colorRgb: "rgba(144,164,174,1)" },
    { id: 2, identifier: "Submitted", label: "Submitted", order: 2, description: "Submitted.", colorRgb: "rgb(228,175,5)" },
    { id: 3, identifier: "Closed", label: "Approved & Closed", order: 3, description: "The order was closed.", colorRgb: "rgb(216,42,39)" },
    { id: 4, identifier: "Rejected", label: "Rejected", order: 4, description: "The order was rejected.", colorRgb: "rgb(234,140,138)" },
  ]);
  await db.insert(schema.opportunityStages).values(
    ["Prospecting", "Investigation", "Proposal made", "Negotiation", "Closed won", "Closed lost"].map((label, i) => ({ id: i + 1, identifier: label.replace(/ (\w)/, (_, c) => c.toUpperCase()).replace(/^\w/, (c) => c.toUpperCase()), label, order: i + 1 })),
  );
  await db.insert(schema.opportunityTypes).values([
    { id: 1, identifier: "NewBusiness", label: "New business", order: 1 },
    { id: 2, identifier: "ExistingBusiness", label: "Existing business", order: 2 },
  ]);

  const countries = await db.insert(schema.countries).values((await sheet("Countries.xlsx")).map((r) => ({ code: str(r.Code), name: str(r.Label) }))).returning();
  const countryByCode = new Map(countries.map((c) => [c.code.toLowerCase(), c.id]));

  const accounts = await db.insert(schema.accounts).values((await sheet("Accounts.xlsx")).map((r, i) => ({
    code: pad("A", i + 1), company: str(r.Company), contact: str(r.Contact), countryId: countryByCode.get(str(r.Country).toLowerCase()) ?? null,
    city: str(r.City) || null, postalCode: str(r.PostalCode) || null, phone: str(r.Phone) || null, email: str(r.Email) || null, createdBy: admin,
  }))).returning();
  const accountByCode = new Map(accounts.map((a) => [a.code.toLowerCase(), a.id]));

  const cats = await db.insert(schema.productCategories).values((await sheet("Categories.xlsx")).map((r, i) => ({ code: pad("C", i + 1), name: str(r.Name), description: str(r.Description) || null, createdBy: admin }))).returning();
  const catByName = new Map(cats.map((c) => [c.name.toLowerCase(), c.id]));

  const brands = await db.insert(schema.brands).values((await sheet("Products.xlsx", "ProductBrand")).map((r) => ({ name: str(r.BrandName), createdBy: admin }))).returning();
  const brandByName = new Map(brands.map((b) => [b.name.toLowerCase(), b.id]));
  const modelRows = await sheet("Products.xlsx", "ProductModel");
  const modelKeys = new Map<string, { name: string; brandId: number }>();
  for (const r of modelRows) {
    const brandId = brandByName.get(str(r.BrandName).toLowerCase());
    if (brandId && !modelKeys.has(str(r.Model).toLowerCase())) modelKeys.set(str(r.Model).toLowerCase(), { name: str(r.Model), brandId });
  }
  const models = await db.insert(schema.models).values([...modelKeys.values()].map((m) => ({ ...m, createdBy: admin }))).returning();
  const modelByName = new Map(models.map((m) => [m.name.toLowerCase(), m.id]));

  const products = await db.insert(schema.products).values((await sheet("Products.xlsx", "Products")).map((r, i) => ({
    code: pad("P", i + 1), name: str(r.Name).toLowerCase(), description: str(r.Description).toLowerCase() || null,
    categoryId: catByName.get(str(r.Category).toLowerCase())!, modelId: modelByName.get(str(r.Model).toLowerCase()) ?? null,
    price: num(r.Price), discount: num(r.Discount), stock: num(r.Stock), reference: str(r.Reference) || null, ean: str(r.EAN) || null,
    weight: str(r.Weight) || null, dimensions: str(r.Dimensions) || null, createdBy: admin,
  }))).returning();
  const productByName = new Map(products.map((p) => [p.name, p]));
  const productByCode = new Map(products.map((p) => [p.code.toLowerCase(), p]));

  const features = (await sheet("Products.xlsx", "ProductFeature")).flatMap((r) => {
    const p = productByName.get(str(r.ProductName).toLowerCase());
    return p ? [{ productId: p.id, description: str(r.Feature), createdBy: admin }] : [];
  });
  if (features.length) await db.insert(schema.productFeatures).values(features);

  const pictures = fs.readdirSync(PICS).filter((f) => f.endsWith(".jpg")).flatMap((f) => {
    const p = productByCode.get(pad("P", Number(f.replace(".jpg", ""))).toLowerCase());
    return p ? [{ productId: p.id, filename: f, filetype: "image/jpeg", file: fs.readFileSync(path.join(PICS, f)), isCover: true, createdBy: admin }] : [];
  });
  if (pictures.length) await db.insert(schema.productPictures).values(pictures);

  const stageByLabel = new Map((await db.select().from(schema.opportunityStages)).map((s) => [s.label.toLowerCase(), s.id]));
  const typeByLabel = new Map((await db.select().from(schema.opportunityTypes)).map((t) => [t.label.toLowerCase(), t.id]));
  const opps = await db.insert(schema.opportunities).values((await sheet("Opportunities.xlsx")).flatMap((r) => {
    const accountId = accountByCode.get(str(r.Account).toLowerCase());
    return accountId ? [{
      accountId, name: str(r.Name), description: str(r.Description) || null,
      opportunityTypeId: typeByLabel.get(str(r.Type).toLowerCase()) ?? 1, opportunityStageId: stageByLabel.get(str(r.Stage).toLowerCase()) ?? 1,
      amount: num(r.Amount), probability: num(r.Probability), expectedRevenue: num(r.ExpectedRevenue), closeOn: dt(r.CloseOn), createdBy: admin,
    }] : [];
  })).returning();
  // Orders.xlsx uses "OPP001" while Opportunities.xlsx generates "OPP0001": match on the number.
  const oppKey = (v: string) => v.toLowerCase().replace(/^opp0*/, "opp");
  const oppByName = new Map(opps.map((o) => [oppKey(o.name), o.id]));

  const statusByLabel = new Map((await db.select().from(schema.orderStatuses)).map((s) => [s.label.toLowerCase(), s.id]));
  let orderId = 0, currentCode = "", rep = 0, total = 0;
  const flush = async () => { if (orderId) await db.update(schema.orders).set({ totalAmount: total }).where(sql`id = ${orderId}`); };
  for (const r of await sheet("Orders.xlsx")) {
    if (str(r.Code) !== currentCode) {
      await flush();
      rep = (rep + 1) % reps.length; currentCode = str(r.Code); total = 0;
      const [o] = await db.insert(schema.orders).values({
        code: currentCode || (await generateCode()), accountId: accountByCode.get(str(r.Account).toLowerCase())!, opportunityId: oppByName.get(oppKey(str(r.Opportunity))) ?? null,
        orderStatusId: statusByLabel.get(str(r.Status).toLowerCase()) ?? 1, expectedClosedOn: dt(r.ExpectedClosedOn)?.toISOString().slice(0, 10) ?? null,
        requiredOn: dt(r.RequiredOn), shippedOn: dt(r.ShippedOn), createdBy: reps[rep],
      }).returning();
      orderId = o.id;
    }
    const p = productByCode.get(str(r.Product).toLowerCase());
    if (!p) continue;
    const amount = lineAmount(p.price, num(r.Quantity), num(r.Discount));
    total += amount;
    await db.insert(schema.orderItems).values({ orderId, productId: p.id, quantity: num(r.Quantity), discount: num(r.Discount), amount, createdBy: reps[rep] });
  }
  await flush();
  const count = async (t: string) => (await db.execute(sql.raw(`select count(*)::int c from "${t}"`)))[0].c;
  for (const t of ["account", "product", "product_feature", "product_picture", "opportunity", "order", "order_item"]) console.log(t, await count(t));
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
