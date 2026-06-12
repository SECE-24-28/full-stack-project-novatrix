import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { WarehouseForm }  from "@/components/warehouses/WarehouseForm";

export default function NewWarehousePage() {
  return (
    <ProtectedRoute permission="create:warehouses">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">New warehouse</h2>
          <p className="mt-1 text-sm text-gray-500">Add a warehouse to your network.</p>
        </div>
        <WarehouseForm />
      </div>
    </ProtectedRoute>
  );
}
