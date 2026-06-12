"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "@apollo/client";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RoleGate }       from "@/components/auth/RoleGate";
import { Badge }          from "@/components/ui/Badge";
import { Button }         from "@/components/ui/Button";
import { Modal }          from "@/components/ui/Modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageLoader }     from "@/components/ui/Spinner";
import { ErrorMessage }   from "@/components/ui/Feedback";
import {
  Table, TableHeader, TableBody,
  TableRow, TableHead, TableCell,
} from "@/components/ui/Table";
import {
  GET_SALES_ORDER,
  PROCESS_SALES_ORDER,
  SHIP_SALES_ORDER,
  DELIVER_SALES_ORDER,
  CANCEL_SALES_ORDER,
  GET_SALES_ORDERS,
} from "@/lib/graphql/operations/salesOrder";
import type { SalesOrder, SalesOrderStatus } from "@/types/salesOrder";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<SalesOrderStatus, "default" | "info" | "success" | "warning" | "danger"> = {
  DRAFT:            "default",
  CONFIRMED:        "info",
  PROCESSING:       "warning",
  PARTIALLY_SHIPPED:"warning",
  SHIPPED:          "info",
  DELIVERED:        "success",
  CANCELLED:        "danger",
  RETURNED:         "danger",
};

const STATUS_LABEL: Record<SalesOrderStatus, string> = {
  DRAFT:            "Draft",
  CONFIRMED:        "Pending",
  PROCESSING:       "Processing",
  PARTIALLY_SHIPPED:"Partially Shipped",
  SHIPPED:          "Shipped",
  DELIVERED:        "Delivered",
  CANCELLED:        "Cancelled",
  RETURNED:         "Returned",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-gray-100 py-2.5 last:border-0">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-900">{value ?? "—"}</dd>
    </div>
  );
}

type ModalType = "process" | "ship" | "deliver" | "cancel";

interface ConfirmModalProps {
  open:         boolean;
  onClose:      () => void;
  title:        string;
  description:  string;
  confirmLabel: string;
  variant?:     "primary" | "destructive";
  loading:      boolean;
  error?:       string;
  onConfirm:    () => void;
}

function ConfirmModal({ open, onClose, title, description, confirmLabel, variant = "primary", loading, error, onConfirm }: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">{description}</p>
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant={variant} loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props { params: Promise<{ id: string }> }

export default function SalesOrderDetailPage({ params }: Props) {
  const { id } = use(params);
  return (
    <ProtectedRoute permission="read:orders">
      <SODetailContent id={id} />
    </ProtectedRoute>
  );
}

function SODetailContent({ id }: { id: string }) {
  const { data, loading, error } = useQuery(GET_SALES_ORDER, { variables: { id } });
  const so: SalesOrder | undefined = data?.salesOrder;

  const [modal, setModal] = useState<ModalType | null>(null);

  const refetch = {
    refetchQueries: [GET_SALES_ORDERS, { query: GET_SALES_ORDER, variables: { id } }],
  };

  const [processSO, { loading: processing, error: processErr }] = useMutation(PROCESS_SALES_ORDER, {
    ...refetch, onCompleted: () => setModal(null),
  });
  const [shipSO, { loading: shipping, error: shipErr }] = useMutation(SHIP_SALES_ORDER, {
    ...refetch, onCompleted: () => setModal(null),
  });
  const [deliverSO, { loading: delivering, error: deliverErr }] = useMutation(DELIVER_SALES_ORDER, {
    ...refetch, onCompleted: () => setModal(null),
  });
  const [cancelSO, { loading: cancelling, error: cancelErr }] = useMutation(CANCEL_SALES_ORDER, {
    ...refetch, onCompleted: () => setModal(null),
  });

  if (loading) return <PageLoader />;
  if (error || !so) return <ErrorMessage message={error?.message ?? "Sales order not found."} />;

  const canProcess = so.status === "CONFIRMED";
  const canShip    = so.status === "PROCESSING";
  const canDeliver = so.status === "SHIPPED";
  const canCancel  = so.status !== "DELIVERED" && so.status !== "CANCELLED" && so.status !== "RETURNED";

  const TIMELINE: SalesOrderStatus[] = ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];
  const currentIdx = TIMELINE.indexOf(so.status);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">{so.soNumber}</h2>
            <Badge variant={STATUS_VARIANT[so.status]}>{STATUS_LABEL[so.status]}</Badge>
          </div>
          <p className="mt-1 text-sm text-gray-500">{so.customerName} &rarr; {so.warehouse.name}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <RoleGate permission="update:orders">
            {canProcess && (
              <Button variant="primary" onClick={() => setModal("process")}>
                Process order
              </Button>
            )}
            {canShip && (
              <Button variant="primary" onClick={() => setModal("ship")}>
                Ship order
              </Button>
            )}
            {canDeliver && (
              <Button variant="primary" onClick={() => setModal("deliver")}>
                Mark as delivered
              </Button>
            )}
            {canCancel && (
              <Button variant="outline" onClick={() => setModal("cancel")} className="text-red-600 border-red-300 hover:bg-red-50">
                Cancel order
              </Button>
            )}
          </RoleGate>
          <Link href="/sales-orders">
            <Button variant="ghost">Back to list</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Left: items ── */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Order items</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Ordered</TableHead>
                    <TableHead className="text-right">Shipped</TableHead>
                    <TableHead className="text-right">Unit price</TableHead>
                    <TableHead className="text-right">Disc %</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {so.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-gray-900">{item.product.name}</TableCell>
                      <TableCell className="font-mono text-xs text-gray-500">{item.product.sku}</TableCell>
                      <TableCell className="text-right tabular-nums">{item.orderedQty} {item.product.unitOfMeasure}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        <span className={item.shippedQty < item.orderedQty && so.status === "DELIVERED" ? "font-semibold text-yellow-600" : ""}>
                          {item.shippedQty}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">₹{Number(item.unitPrice).toFixed(4)}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{Number(item.discountPct).toFixed(1)}%</TableCell>
                      <TableCell className="text-right tabular-nums text-sm font-medium">₹{Number(item.totalPrice).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Totals */}
              <div className="space-y-1 border-t border-gray-100 px-6 py-4 text-right">
                <div className="flex justify-end gap-8 text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span className="w-24 tabular-nums">₹{Number(so.subtotal).toFixed(2)}</span>
                </div>
                {Number(so.discountAmount) > 0 && (
                  <div className="flex justify-end gap-8 text-sm text-green-600">
                    <span>Discount</span>
                    <span className="w-24 tabular-nums">-₹{Number(so.discountAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-end gap-8 text-sm text-gray-500">
                  <span>Tax</span>
                  <span className="w-24 tabular-nums">₹{Number(so.taxAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-end gap-8 border-t border-gray-200 pt-1 text-base font-bold text-gray-900">
                  <span>Total</span>
                  <span className="w-24 tabular-nums">₹{Number(so.totalAmount).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {so.notes && (
            <Card>
              <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-gray-600">{so.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Right: meta + status ── */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Order info</CardTitle></CardHeader>
            <CardContent>
              <dl>
                <DetailRow label="Customer"      value={so.customerName} />
                {so.customerEmail && <DetailRow label="Email"   value={so.customerEmail} />}
                {so.customerPhone && <DetailRow label="Phone"   value={so.customerPhone} />}
                <DetailRow label="Warehouse"     value={so.warehouse.name} />
                <DetailRow label="Order date"    value={new Date(so.orderDate).toLocaleDateString()} />
                <DetailRow
                  label="Required date"
                  value={so.requiredDate ? new Date(so.requiredDate).toLocaleDateString() : null}
                />
                <DetailRow
                  label="Shipped date"
                  value={so.shippedDate ? new Date(so.shippedDate).toLocaleDateString() : null}
                />
                <DetailRow
                  label="Delivered date"
                  value={so.deliveredDate ? new Date(so.deliveredDate).toLocaleDateString() : null}
                />
                {so.shippingAddress && (
                  <DetailRow label="Ship to" value={so.shippingAddress} />
                )}
                <DetailRow label="Items" value={`${so.items.length} line(s)`} />
              </dl>
            </CardContent>
          </Card>

          {/* Status timeline */}
          <Card>
            <CardHeader><CardTitle>Status</CardTitle></CardHeader>
            <CardContent>
              {TIMELINE.map((s, idx) => {
                const isDone    = so.status !== "CANCELLED" && currentIdx >= idx;
                const isCurrent = so.status === s;
                return (
                  <div key={s} className="flex items-center gap-3 py-2">
                    <div className={`h-3 w-3 flex-shrink-0 rounded-full ${isDone ? "bg-blue-600" : "bg-gray-200"} ${isCurrent ? "ring-2 ring-blue-300" : ""}`} />
                    <span className={`text-sm ${isCurrent ? "font-semibold text-gray-900" : isDone ? "text-gray-700" : "text-gray-400"}`}>
                      {STATUS_LABEL[s]}
                    </span>
                  </div>
                );
              })}
              {so.status === "CANCELLED" && (
                <div className="flex items-center gap-3 py-2">
                  <div className="h-3 w-3 flex-shrink-0 rounded-full bg-red-500" />
                  <span className="text-sm font-semibold text-red-600">Cancelled</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Confirm modals ── */}
      <ConfirmModal
        open={modal === "process"}
        onClose={() => setModal(null)}
        title="Process sales order"
        description={`Move ${so.soNumber} to processing? Inventory will be deducted when the order is shipped.`}
        confirmLabel="Process"
        loading={processing}
        error={processErr?.graphQLErrors[0]?.message ?? processErr?.message}
        onConfirm={() => processSO({ variables: { id } })}
      />

      <ConfirmModal
        open={modal === "ship"}
        onClose={() => setModal(null)}
        title="Ship sales order"
        description={`Ship ${so.soNumber}? This will deduct inventory quantities for all items in this order.`}
        confirmLabel="Confirm shipment"
        loading={shipping}
        error={shipErr?.graphQLErrors[0]?.message ?? shipErr?.message}
        onConfirm={() => shipSO({ variables: { id } })}
      />

      <ConfirmModal
        open={modal === "deliver"}
        onClose={() => setModal(null)}
        title="Mark as delivered"
        description={`Mark ${so.soNumber} as delivered? This completes the order.`}
        confirmLabel="Confirm delivery"
        loading={delivering}
        error={deliverErr?.graphQLErrors[0]?.message ?? deliverErr?.message}
        onConfirm={() => deliverSO({ variables: { id } })}
      />

      <ConfirmModal
        open={modal === "cancel"}
        onClose={() => setModal(null)}
        title="Cancel sales order"
        description={`Cancel ${so.soNumber}? If already shipped, inventory will be restored. This cannot be undone.`}
        confirmLabel="Cancel order"
        variant="destructive"
        loading={cancelling}
        error={cancelErr?.graphQLErrors[0]?.message ?? cancelErr?.message}
        onConfirm={() => cancelSO({ variables: { id } })}
      />
    </div>
  );
}
