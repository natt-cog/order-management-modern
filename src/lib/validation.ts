// Ports of OrderManagement_CS *_Validate server actions (messages kept verbatim from the O11 model).
export type Issues = string[];

export function validateOrder(o: { totalAmount: number; orderStatusId?: number | null; accountId?: number | null }): Issues {
  const e: Issues = [];
  if (!o.accountId) e.push("Account must be filled");
  if (o.totalAmount < 0) e.push("Total amount must be greater or equal to zero");
  if (!o.orderStatusId) e.push("Status is required");
  return e;
}

export function validateOrderItem(i: { orderId?: number | null; productId?: number | null; quantity: number; discount: number }, availableStock: number): Issues {
  const e: Issues = [];
  if (!i.orderId) e.push("Order is required");
  if (!i.productId) e.push("Product is required");
  if (!(i.quantity > 0)) e.push("Quantity must be greater than zero");
  if (i.discount < 0) e.push("Discount must be greater or equal to zero");
  if (availableStock < i.quantity) e.push("Insufficient stock to fulfill your order");
  return e;
}

export function validateProduct(p: { name: string; categoryId?: number | null; price: number; stock: number }): Issues {
  const e: Issues = [];
  if (p.name.trim() === "") e.push("Name is required");
  if (!p.categoryId) e.push("Category is required");
  if (p.price < 0) e.push("Price must be greater or equal to zero");
  if (p.stock < 0) e.push("Stock must be greater or equal to zero");
  return e;
}

// O11 quirk kept: the "Code is required" message is raised when Contact is empty,
// and the duplicate *Code* check reports "Company name must be unique".
export function validateAccount(a: { company: string; contact: string; codeTaken: boolean }): Issues {
  const e: Issues = [];
  if (a.company.trim() === "") e.push("Company name is required");
  if (a.codeTaken) e.push("Company name must be unique");
  if (a.contact.trim() === "") e.push("Code is required");
  return e;
}

export function validateOpportunity(o: { name: string; nameTaken: boolean; typeId?: number | null; stageId?: number | null; amount: number; probability: number; expectedRevenue: number }): Issues {
  const e: Issues = [];
  if (o.name.trim() === "") e.push("Name is required");
  if (o.nameTaken) e.push("Name must be unique");
  if (!o.typeId) e.push("Type is required");
  if (!o.stageId) e.push("Stage is required");
  if (o.amount < 0) e.push("Amount revenue must be greater or equal to zero");
  if (o.probability < 0) e.push("Probability must be greater or equal to zero");
  if (o.probability > 100) e.push("Probability must be leaser or equal to one hundred");
  if (o.expectedRevenue < 0) e.push("Expected revenue must be greater or equal to zero");
  return e;
}

export class ValidationError extends Error {
  constructor(public issues: Issues) {
    super(issues.join("\n"));
    this.name = "ValidationError";
  }
}
