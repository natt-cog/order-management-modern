import { expect, test, type Page } from "@playwright/test";

async function loginAs(page: Page, name: string) {
  await page.goto("/login");
  await page.getByRole("button", { name: "Sample Users" }).click();
  await page.getByRole("button", { name: new RegExp(name) }).click();
  await page.waitForURL(/dashboard/);
}

test("担当者（Manuel）は Dashboard に着地し、Manager 画面は権限エラー", async ({ page }) => {
  await loginAs(page, "Manuel Luís");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("Personal Goal")).toBeVisible();
  await expect(page.getByText("€50k")).toBeVisible();
  await expect(page.getByText("Draft orders")).toBeVisible();
  await page.goto("/dashboard-manager");
  await expect(page).toHaveURL(/invalid-permissions/);
});

test("Manager（José）は DashboardManager に着地", async ({ page }) => {
  await loginAs(page, "José Felix");
  await expect(page).toHaveURL(/dashboard-manager/);
  await expect(page.getByText("Company Goal")).toBeVisible();
  await expect(page.getByText("€7k")).toBeVisible();
  await expect(page.getByText("Top performers")).toBeVisible();
});

test("Orders 一覧は O11 実機と同じ並び・件数・金額", async ({ page }) => {
  await loginAs(page, "Manuel Luís");
  await page.goto("/orders");
  await expect(page.getByTestId("pagination-counter")).toHaveText("1 to 20 of 58 items");
  const first = page.getByTestId("orders-table").locator("tbody tr").first();
  await expect(first).toContainText("ORD0004");
  await expect(first).toContainText("€761.97");
  await expect(page.getByTestId("orders-table")).toContainText("€20,629.40");
  await expect(page.getByTestId("amount-range")).toHaveText("€0.00 – €20,700.00");
  await page.getByPlaceholder("Search by order number or company").fill("ORD0011");
  await expect(page.getByTestId("pagination-counter")).toHaveText("1 to 1 of 1 items");
});

test("Invoices は Approved & Closed が無いので空表示", async ({ page }) => {
  await loginAs(page, "Ana Martins");
  await page.goto("/invoices");
  await expect(page.getByText("There aren't any Invoices to show.")).toBeVisible();
});

test("Catalog は 12 件表示 + Load more", async ({ page }) => {
  await loginAs(page, "Ana Martins");
  await page.goto("/products");
  await expect(page.getByTestId("catalog-count")).toHaveText("12 of 28 products");
  await page.getByRole("link", { name: "Load more" }).click();
  await expect(page.getByTestId("catalog-count")).toHaveText("24 of 28 products");
});

test("注文作成 → 明細追加 → 在庫チェック → Submit → Manager 承認", async ({ page, browser }) => {
  await loginAs(page, "Manuel Luís");
  await page.goto("/orders/new");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Account must be filled")).toBeVisible();
  await page.getByLabel("Account").selectOption({ label: "Bankpeer" });
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("The order was successfully saved.")).toBeVisible();
  const url = page.url();
  await page.getByRole("button", { name: "Add new product" }).click();
  await page.getByLabel("Product").selectOption({ label: "ssd 1tb" });
  await page.getByLabel("Units").fill("100000");
  await expect(page.getByText(/Only \d+ in stock/)).toBeVisible();
  await page.getByLabel("Units").fill("2");
  await page.getByLabel("Discount").fill("10");
  await expect(page.getByTestId("item-total")).toHaveText("€449.98");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByTestId("order-total")).toHaveText("€449.98");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText("The order status was changed.")).toBeVisible();

  const ctx = await browser.newContext();
  const mgr = await ctx.newPage();
  await loginAs(mgr, "José Felix");
  await mgr.goto(url);
  await mgr.getByRole("button", { name: "Approve" }).click();
  await expect(mgr.getByText("The order status was changed.")).toBeVisible();
  await ctx.close();
});
