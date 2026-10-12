import { OrdersTable } from "@/components/orders-table";
import { listOrders } from "@/lib/order-queries";

// Invoices screen: orders whose status is Closed ("Approved & Closed")
export default async function InvoicesPage() {
  const rows = await listOrders({ status: 3, sort: "code", dir: "desc" });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Invoices</h1>
      <OrdersTable rows={rows} />
    </div>
  );
}
