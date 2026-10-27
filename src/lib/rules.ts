// O11 OrderManagement_CS のサーバーアクションのビジネスルール移植

/** *_GenerateCode: 既存最大コードの数値部 + 1 を 4 桁ゼロ埋め（例: ORD0001, A0001, P0001） */
export function nextCode(prefix: string, maxCode: string | null): string {
  if (!maxCode) return `${prefix}0001`;
  const n = parseInt(maxCode.slice(prefix.length, prefix.length + 4), 10) + 1;
  return `${prefix}${String(n).padStart(4, "0")}`;
}

/** OrderItem_Save: Amount = Price*Qty - Price*Qty*(Discount/100) */
export function amountOf(price: number, quantity: number, discountPercent: number): number {
  return price * quantity - price * quantity * (discountPercent / 100);
}

/** ProductDetail 画面の Final price = Price * (1 - Discount/100) */
export function finalPrice(price: number, discountPercent: number): number {
  return price * (1 - discountPercent / 100);
}

export class InvalidArgumentsException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidArgumentsException";
  }
}

export class PermissionException extends Error {
  constructor(message = "You don't have permissions to execute this action.") {
    super(message);
    this.name = "PermissionException";
  }
}
