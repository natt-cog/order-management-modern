export type Role = "OrderManager" | "OrderRepresentative";

// OutSystems: CheckOrderManagerRole() / CheckOrderRepresentativeRole() (OrderManagement_CS roles)
export const isManager = (role?: Role | null) => role === "OrderManager";
export const canUseOrders = (role?: Role | null) => role === "OrderManager" || role === "OrderRepresentative";

export class SecurityException extends Error {
  constructor(message = "You don't have permissions to execute this action.") {
    super(message);
    this.name = "SecurityException";
  }
}

export function assertCanUseOrders(role?: Role | null) {
  if (!canUseOrders(role)) throw new SecurityException();
}
