import { describe, expect, it } from "vitest";
import { validateAccount, validateOpportunity, validateOrder, validateOrderItem, validateProduct } from "@/lib/validation";

describe("O11 *_Validate ports", () => {
  it("Order_Validate", () => {
    expect(validateOrder({ accountId: 1, totalAmount: 0, orderStatusId: 1 })).toEqual([]);
    expect(validateOrder({ accountId: 1, totalAmount: -1, orderStatusId: null })).toEqual(["Total amount must be greater or equal to zero", "Status is required"]);
    expect(validateOrder({ accountId: null, totalAmount: 0, orderStatusId: 1 })).toEqual(["Account must be filled"]);
  });
  it("OrderItem_Validate incl. stock", () => {
    expect(validateOrderItem({ orderId: 1, productId: 1, quantity: 5, discount: 0 }, 5)).toEqual([]);
    expect(validateOrderItem({ orderId: 1, productId: 1, quantity: 6, discount: 0 }, 5)).toEqual(["Insufficient stock to fulfill your order"]);
    expect(validateOrderItem({ orderId: 1, productId: 1, quantity: 0, discount: -1 }, 5)).toEqual(["Quantity must be greater than zero", "Discount must be greater or equal to zero"]);
  });
  it("Product_Validate", () => {
    expect(validateProduct({ name: " ", categoryId: null, price: -1, stock: -1 })).toHaveLength(4);
    expect(validateProduct({ name: "x", categoryId: 1, price: 0, stock: 0 })).toEqual([]);
  });
  it("Account_Validate keeps O11 message quirks", () => {
    expect(validateAccount({ company: "", contact: "", codeTaken: true })).toEqual(["Company name is required", "Company name must be unique", "Code is required"]);
  });
  it("Opportunity_Validate", () => {
    const ok = { name: "OPP1", nameTaken: false, typeId: 1, stageId: 1, amount: 0, probability: 50, expectedRevenue: 0 };
    expect(validateOpportunity(ok)).toEqual([]);
    expect(validateOpportunity({ ...ok, probability: 101 })).toEqual(["Probability must be leaser or equal to one hundred"]);
    expect(validateOpportunity({ ...ok, nameTaken: true })).toEqual(["Name must be unique"]);
  });
});
