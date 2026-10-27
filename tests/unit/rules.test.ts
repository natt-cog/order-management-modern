import { describe, expect, it } from "vitest";
import { amountOf, finalPrice, nextCode } from "@/lib/rules";
import { formatCurrency, formatPretty } from "@/lib/format";

describe("コード採番（Order_GenerateCode / Account / Product）", () => {
  it("初回は 0001", () => expect(nextCode("ORD", null)).toBe("ORD0001"));
  it("最大値 + 1 を 4 桁ゼロ埋め", () => {
    expect(nextCode("ORD", "ORD0058")).toBe("ORD0059");
    expect(nextCode("A", "A0014")).toBe("A0015");
    expect(nextCode("P", "P0099")).toBe("P0100");
  });
});

describe("OrderItem_Save の金額計算", () => {
  it("Price * Qty - Price * Qty * Discount/100", () => {
    expect(amountOf(175.99, 1, 0)).toBeCloseTo(175.99, 8);
    expect(amountOf(100, 3, 10)).toBeCloseTo(270, 8);
  });
  it("ProductDetail の Final price", () => expect(finalPrice(100, 15)).toBeCloseTo(85, 8));
});

describe("O11 実機と同じ金額表示", () => {
  it("小数 2 桁・桁区切り", () => expect(formatCurrency("761.97000000")).toBe("€761.97"));
  it("20629.405 は O11 と同じく €20,629.40", () => expect(formatCurrency("20629.40500000")).toBe("€20,629.40"));
  it("null は €0.00", () => expect(formatCurrency(null)).toBe("€0.00"));
  it("PrettyFormatCurrency は k 表記", () => {
    expect(formatPretty(50000)).toBe("€50k");
    expect(formatPretty(5400)).toBe("€5k");
    expect(formatPretty(2719000, 0)).toBe("€2,719k");
    expect(formatPretty(999)).toBe("€999");
  });
});
