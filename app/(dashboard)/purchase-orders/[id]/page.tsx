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
  GET_PURCHASE_ORDER,
  APPROVE_PURCHASE_ORDER,
  CANCEL_PURCHASE_ORDER,
  RECEIVE_PURCHASE_ORDER,
  GET_PURCHASE_ORDERS,
} from "@/lib/graphql/operations/purchaseOrder";
import type { PurchaseOrder, PurchaseOrderStatus } from "@/types/purchaseOrder";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<PurchaseOrderStatus, "default" | "info" | "success" | "warning" | "danger"> = {
  DRAFT:              "default",
  SUBMITTED:          "info",
  APPROVED:           "warning",
  PARTIALLY_RECEIVED: "warning",
  RECEIVED:           "success",
  CANCELLED:          "danger",
};

const STATUS_LABEL: Record<PurchaseOrderStatus, string> = {
  DRAFT:              "Draft",
  SUBMITTED:          "Pending",
  APPROVED:           "Approved",
  PARTIALLY_RECEIVED: "Partially Received",
  RECEIVED:           "Delivered",
  CANCELLED:          "Cancelled",
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-gray-100 py-2.5 last:border-0">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-900">{value ?? "—"}</dd>
    </div>
  );
}

// ─── Confirm modal ────────────────────────────────────────────────────────────

interface ConfirmModalProps {
  open:        boolean;
  onClose:     () => void;
  title:       string;
  description: string;
  confirmLabel: string;
  variant?:    "primary" | "destructive";
  loading:     boolean;
  error?:      string;
  onConfirm:   () => void;
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

export default function PurchaseOrderDetailPage({ params }: Props) {
  const { id } = use(params);
  return (
    <ProtectedRoute permission="read:orders">
      <PODetailContent id={id} />
    </ProtectedRoute>
  );
}

function PODetailContent({ id }: { id: string }) {
  const { data, loading, error } = useQuery(GET_PURCHASE_ORDER, { variables: { id } });
  const po: PurchaseOrder | undefined = data?.purchaseOrder;

  const [modal, setModal] = useState<"approve" | "cancel" | "receive" | null>(null);

  const refetch = { refetchQueries: [GET_PURCHASE_ORDERS, { query: GET_PURCHASE_ORDER, variables: { id } }] };

  const [approvePO, { loading: approving, error: approveErr }] = useMutation(APPROVE_PURCHASE_ORDER, {
    ...refetch,
    onCompleted: () => setModal(null),
  });
  const [cancelPO, { loading: cancelling, error: cancelErr }] = useMutation(CANCEL_PURCHASE_ORDER, {
    ...refetch,
    onCompleted: () => setModal(null),
  });
  const [receivePO, { loading: receiving, error: receiveErr }] = useMutation(RECEIVE_PURCHASE_ORDER, {
    ...refetch,
    onCompleted: () => setModal(null),
  });

  if (loading) return <PageLoader />;
  if (error || !po) return <ErrorMessage message={error?.message ?? "Purchase order not found."} />;

  const canApprove  = po.status === "SUBMITTED";
  const canCancel   = po.status !== "RECEIVED" && po.status !== "CANCELLED";
  const canReceive  = po.status === "APPROVED";

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">{po.poNumber}</h2>
            <Badge variant={STATUS_VARIANT[po.status]}>{STATUS_LABEL[po.status]}</Badge>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {po.supplier.name} &rarr; {po.warehouse.name}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <RoleGate permission="update:orders">
            {canApprove && (
              <Button variant="primary" onClick={() => setModal("approve")}>
                Approve
              </Button>
            )}
            {canReceive && (
              <Button variant="primary" onClick={() => setModal("receive")}>
                Mark as delivered
              </Button>
            )}
            {canCancel && (
              <Button variant="outline" onClick={() => setModal("cancel")} className="text-red-600 border-red-300 hover:bg-red-50">
                Cancel order
              </Button>
            )}
          </RoleGate>
          <Link href="/purchase-orders">
            <Button variant="ghost">Back to list</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Left: items ── */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Order items</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Ordered</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                    <TableHead className="text-right">Unit cost</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {po.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-gray-900">{item.product.name}</TableCell>
                      <TableCell className="font-mono text-xs text-gray-500">{item.product.sku}</TableCell>
                      <TableCell className="text-right tabular-nums">{item.orderedQty} {item.product.unitOfMeasure}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        <span className={item.receivedQty < item.orderedQty && po.status === "RECEIVED" ? "text-yellow-600 font-semibold" : ""}>
                          {item.receivedQty}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">₹{Number(item.unitCost).toFixed(4)}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm font-medium">₹{Number(item.totalCost).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Totals */}
              <div className="space-y-1 border-t border-gray-100 px-6 py-4 text-right">
                <div className="flex justify-end gap-8 text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span className="tabular-nums w-24">₹{Number(po.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-end gap-8 text-sm text-gray-500">
                  <span>Tax</span>
                  <span className="tabular-nums w-24">₹{Number(po.taxAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-end gap-8 text-base font-bold text-gray-900 pt-1 border-t border-gray-200">
                  <span>Total</span>
                  <span className="tabular-nums w-24">₹{Number(po.totalAmount).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {po.notes && (
            <Card>
              <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-gray-600">{po.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Right: meta ── */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Order info</CardTitle></CardHeader>
            <CardContent>
              <dl>
                <DetailRow label="Supplier"      value={po.supplier.name} />
                <DetailRow label="Supplier code" value={<span className="font-mono text-xs">{po.supplier.code}</span>} />
                <DetailRow label="Warehouse"     value={po.warehouse.name} />
                <DetailRow label="Order date"    value={new Date(po.orderDate).toLocaleDateString()} />
                <DetailRow
                  label="Expected date"
                  value={po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : null}
                />
                <DetailRow
                  label="Received date"
                  value={po.receivedDate ? new Date(po.receivedDate).toLocaleDateString() : null}
                />
                <DetailRow label="Items"         value={`${po.items.length} line(s)`} />
                <DetailRow label="Created"       value={new Date(po.createdAt).toLocaleDateString()} />
              </dl>
            </CardContent>
          </Card>

          {/* Status timeline */}
          <Card>
            <CardHeader><CardTitle>Status</CardTitle></CardHeader>
            <CardContent>
              {(["SUBMITTED", "APPROVED", "RECEIVED"] as PurchaseOrderStatus[]).map((s) => {
                const statuses: PurchaseOrderStatus[] = ["SUBMITTED", "APPROVED", "PARTIALLY_RECEIVED", "RECEIVED"];
                const currentIdx = statuses.indexOf(po.status);
                const stepIdx    = statuses.indexOf(s);
                const isDone     = po.status !== "CANCELLED" && currentIdx >= stepIdx;
                const isCurrent  = po.status === s;
                return (
                  <div key={s} className="flex items-center gap-3 py-2">
                    <div className={`h-3 w-3 rounded-full flex-shrink-0 ${isDone ? "bg-blue-600" : "bg-gray-200"} ${isCurrent ? "ring-2 ring-blue-300" : ""}`} />
                    <span className={`text-sm ${isCurrent ? "font-semibold text-gray-900" : isDone ? "text-gray-700" : "text-gray-400"}`}>
                      {STATUS_LABEL[s]}
                    </span>
                  </div>
                );
              })}
              {po.status === "CANCELLED" && (
                <div className="flex items-center gap-3 py-2">
                  <div className="h-3 w-3 rounded-full bg-red-500 flex-shrink-0" />
                  <span className="text-sm font-semibold text-red-600">Cancelled</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Confirm modals ── */}
      <ConfirmModal
        open={modal === "approve"}
        onClose={() => setModal(null)}
        title="Approve purchase order"
        description={`Approve ${po.poNumber}? Once approved, it can be marked as delivered to update inventory.`}
        confirmLabel="Approve"
        loading={approving}
        error={approveErr?.graphQLErrors[0]?.message ?? approveErr?.message}
        onConfirm={() => approvePO({ variables: { id } })}
      />

      <ConfirmModal
        open={modal === "receive"}
        onClose={() => setModal(null)}
        title="Mark as delivered"
        description={`Mark ${po.poNumber} as delivered? This will increase inventory quantities for all items in this order.`}
        confirmLabel="Confirm delivery"
        loading={receiving}
        error={receiveErr?.graphQLErrors[0]?.message ?? receiveErr?.message}
        onConfirm={() => receivePO({ variables: { id } })}
      />

      <ConfirmModal
        open={modal === "cancel"}
        onClose={() => setModal(null)}
        title="Cancel purchase order"
        description={`Cancel ${po.poNumber}? This action cannot be undone.`}
        confirmLabel="Cancel order"
        variant="destructive"
        loading={cancelling}
        error={cancelErr?.graphQLErrors[0]?.message ?? cancelErr?.message}
        onConfirm={() => cancelPO({ variables: { id } })}
      />
    </div>
  );
}
