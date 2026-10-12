import { expect, type Page } from "@playwright/test";

export async function loginAs(page: Page, name: "Manuel Luís" | "Ana Martins" | "José Felix") {
  await page.goto("/login");
  await page.getByRole("button", { name: new RegExp(name) }).click();
  await expect(page.getByTestId("current-user")).toHaveText(name);
}
