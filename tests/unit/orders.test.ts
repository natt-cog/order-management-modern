import { describe, expect, it, vi } from "vitest";
vi.mock("@/db", () => ({ db: {}, schema: {} }));
import { lineAmount, nextOrderCode } from "@/lib/orders";
import { canUseOrders, isManager } from "@/lib/permissions";

describe("Order_GenerateCode", () => {
  it("formats ORDnnnn", () => {
    expect(nextOrderCode(null)).toBe("ORD0001");
    expect(nextOrderCode("ORD0009")).toBe("ORD0010");
    expect(nextOrderCode("ORD0099")).toBe("ORD0100");
    expect(nextOrderCode("ORD0999")).toBe("ORD1000");
  });
});

describe("OrderItem amount", () => {
  it("price * qty minus discount %", () => {
    expect(lineAmount(533.9, 1, 10)).toBe(480.51);
    expect(lineAmount(100, 3, 0)).toBe(300);
  });
});

describe("roles", () => {
  it("OrderManager / OrderRepresentative", () => {
    expect(isManager("OrderManager")).toBe(true);
    expect(isManager("OrderRepresentative")).toBe(false);
    expect(canUseOrders("OrderRepresentative")).toBe(true);
    expect(canUseOrders(null)).toBe(false);
  });
});
