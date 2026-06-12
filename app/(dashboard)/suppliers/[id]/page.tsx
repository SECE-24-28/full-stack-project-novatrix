"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@apollo/client";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RoleGate }       from "@/components/auth/RoleGate";
import { Badge }          from "@/components/ui/Badge";
import { Button }         from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageLoader }     from "@/components/ui/Spinner";
import { ErrorMessage }   from "@/components/ui/Feedback";
import {
  Table, TableHeader, TableBody,
  TableRow, TableHead, TableCell,
} from "@/components/ui/Table";
import { GET_SUPPLIER } from "@/lib/graphql/operations/supplier";
import type { Supplier } from "@/types/supplier";

const STATUS_VARIANT = {
  ACTIVE:      "success",
  INACTIVE:    "warning",
  BLACKLISTED: "danger",
} as const;

const PO_STATUS_VARIANT: Record<string, "success" | "warning" | "info" | "default" | "danger"> = {
  RECEIVED:           "success",
  APPROVED:           "info",
  SUBMITTED:          "info",
  PARTIALLY_RECEIVED: "warning",
  DRAFT:              "default",
  CANCELLED:          "danger",
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-gray-100 py-2.5 last:border-0">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-900">{value ?? "—"}</dd>
    </div>
  );
}

interface Props { params: Promise<{ id: string }> }

export default function SupplierDetailPage({ params }: Props) {
  const { id } = use(params);
  return (
    <ProtectedRoute permission="read:suppliers">
      <SupplierDetailContent id={id} />
    </ProtectedRoute>
  );
}

function SupplierDetailContent({ id }: { id: string }) {
  const { data, loading, error } = useQuery(GET_SUPPLIER, { variables: { id } });
  const supplier: Supplier | undefined = data?.supplier;

  if (loading) return <PageLoader />;
  if (error || !supplier) return <ErrorMessage message={error?.message ?? "Supplier not found."} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">{supplier.name}</h2>
            <Badge variant={STATUS_VARIANT[supplier.status] ?? "default"}>
              {supplier.status}
            </Badge>
          </div>
          <p className="mt-1 font-mono text-sm text-gray-500">{supplier.code}</p>
        </div>
        <div className="flex gap-2">
          <RoleGate permission="update:suppliers">
            <Link href={`/suppliers/${id}/edit`}>
              <Button variant="outline">Edit supplier</Button>
            </Link>
          </RoleGate>
          <Link href="/suppliers">
            <Button variant="ghost">Back to list</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Contact */}
          <Card>
            <CardHeader><CardTitle>Contact details</CardTitle></CardHeader>
            <CardContent>
              <dl>
                <DetailRow label="Contact name" value={supplier.contactName} />
                <DetailRow label="Email"        value={supplier.email} />
                <DetailRow label="Phone"        value={supplier.phone} />
                <DetailRow label="Address"      value={supplier.address} />
                <DetailRow label="City"         value={supplier.city} />
                <DetailRow label="Country"      value={supplier.country} />
              </dl>
            </CardContent>
          </Card>

          {/* Purchase History */}
          <Card>
            <CardHeader><CardTitle>Purchase history</CardTitle></CardHeader>
            <CardContent className="p-0">
              {supplier.purchaseHistory.length === 0 ? (
                <p className="px-6 py-4 text-sm text-gray-500">No purchase orders yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplier.purchaseHistory.map((po) => (
                      <TableRow key={po.id}>
                        <TableCell className="font-mono text-xs text-gray-600">{po.poNumber}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(po.orderDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={PO_STATUS_VARIANT[po.status] ?? "default"}>
                            {po.status.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm font-medium">
                          ${Number(po.totalAmount).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Supplier info</CardTitle></CardHeader>
            <CardContent>
              <dl>
                <DetailRow label="GST number"     value={supplier.gstNumber} />
                <DetailRow label="Payment terms"  value={`${supplier.paymentTerms} days`} />
                <DetailRow label="Products"       value={supplier.productCount} />
                <DetailRow label="Created"        value={new Date(supplier.createdAt).toLocaleDateString()} />
                <DetailRow label="Last updated"   value={new Date(supplier.updatedAt).toLocaleDateString()} />
              </dl>
            </CardContent>
          </Card>

          {supplier.notes && (
            <Card>
              <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-gray-600">{supplier.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
