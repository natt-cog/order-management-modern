import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers";

test("unauthenticated users are sent to login", async ({ page }) => {
  await page.goto("/orders");
  await expect(page).toHaveURL(/\/login/);
});

test("sales rep: catalog, orders filter, accounts, opportunities, invoices", async ({ page }) => {
  await loginAs(page, "Manuel Luís");
  await expect(page.getByTestId("personal-goal")).toBeVisible();
  await page.goto("/products");
  await expect(page.getByTestId("product-count")).toHaveText("Showing 12 of 28 products");
  await page.getByRole("link", { name: "Load more" }).click();
  await expect(page.getByTestId("product-card")).toHaveCount(24);
  await page.goto("/orders");
  await expect(page.getByText("58 orders")).toBeVisible();
  await page.getByRole("link", { name: "Submitted", exact: true }).click();
  await expect(page.getByTestId("orders-table").locator("tbody tr").first()).toContainText("Submitted");
  await page.goto("/accounts");
  await expect(page.getByTestId("accounts-table").locator("tbody tr")).toHaveCount(14);
  await page.goto("/opportunities");
  await expect(page.getByTestId("opps-table")).toBeVisible();
  await page.goto("/dashboard-manager");
  await expect(page).toHaveURL(/invalid-permissions/);
});

test("order lifecycle: create, add item (stock + total), validation, submit, manager approves", async ({ page }) => {
  await loginAs(page, "Ana Martins");
  await page.goto("/orders");
  await page.getByRole("button", { name: "New Order" }).click();
  await expect(page.getByTestId("order-code")).toHaveText(/ORD\d{4}/);
  const code = await page.getByTestId("order-code").textContent();
  const add = page.getByTestId("add-item");
  await add.getByLabel("Product").selectOption({ label: await add.getByLabel("Product").locator("option").first().textContent() ?? "" });
  await add.getByLabel("Quantity").fill("100000");
  await add.getByRole("button", { name: "Add product" }).click();
  await expect(page.locator("p[role=alert]")).toContainText("Insufficient stock to fulfill your order");
  await add.getByLabel("Quantity").fill("2");
  await add.getByLabel("Discount %").fill("10");
  await add.getByRole("button", { name: "Add product" }).click();
  await expect(page.getByTestId("items-table").locator("tbody tr")).toHaveCount(1);
  await expect(page.getByTestId("order-total")).not.toHaveText("€ 0.00");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText("Submitted", { exact: true }).first()).toBeVisible();
  await expect(page.getByTestId("add-item")).toHaveCount(0);

  await page.getByRole("button", { name: "Logout" }).click();
  await loginAs(page, "José Felix");
  await expect(page.getByTestId("team-goal")).toBeVisible();
  await page.getByRole("link", { name: code! }).click();
  await page.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByText("Approved & Closed").first()).toBeVisible();
  await page.goto("/invoices");
  await expect(page.getByRole("link", { name: code! })).toBeVisible();
});

test("product validation messages", async ({ page }) => {
  await loginAs(page, "José Felix");
  await page.goto("/products");
  await page.getByTestId("product-card").first().click();
  await expect(page).toHaveURL(/\/products\/\d+/);
  await page.getByLabel("Name", { exact: true }).fill("");
  await page.getByLabel("Stock").fill("-1");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.locator("p[role=alert]")).toContainText("Name is required");
  await expect(page.locator("p[role=alert]")).toContainText("Stock must be greater or equal to zero");
});
