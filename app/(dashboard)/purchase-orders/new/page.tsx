import { ProtectedRoute }      from "@/components/auth/ProtectedRoute";
import { PurchaseOrderForm }   from "@/components/purchaseOrders/PurchaseOrderForm";

export default function NewPurchaseOrderPage() {
  return (
    <ProtectedRoute permission="create:orders">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">New purchase order</h2>
          <p className="mt-1 text-sm text-gray-500">Create a purchase order and submit it for approval.</p>
        </div>
        <PurchaseOrderForm />
      </div>
    </ProtectedRoute>
  );
}
