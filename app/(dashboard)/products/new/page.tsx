import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ProductForm }    from "@/components/products/ProductForm";

export default function NewProductPage() {
  return (
    <ProtectedRoute permission="create:products">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">New product</h2>
          <p className="mt-1 text-sm text-gray-500">Add a new product to the catalogue.</p>
        </div>
        <ProductForm />
      </div>
    </ProtectedRoute>
  );
}
