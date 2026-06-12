import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SupplierForm }   from "@/components/suppliers/SupplierForm";

export default function NewSupplierPage() {
  return (
    <ProtectedRoute permission="create:suppliers">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">New supplier</h2>
          <p className="mt-1 text-sm text-gray-500">Add a new supplier to the system.</p>
        </div>
        <SupplierForm />
      </div>
    </ProtectedRoute>
  );
}
