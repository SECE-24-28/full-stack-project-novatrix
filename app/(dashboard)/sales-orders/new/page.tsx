import { ProtectedRoute }    from "@/components/auth/ProtectedRoute";
import { SalesOrderForm }    from "@/components/salesOrders/SalesOrderForm";

export default function NewSalesOrderPage() {
  return (
    <ProtectedRoute permission="create:orders">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">New sales order</h2>
          <p className="mt-1 text-sm text-gray-500">Create a sales order to issue stock from a warehouse.</p>
        </div>
        <SalesOrderForm />
      </div>
    </ProtectedRoute>
  );
}
