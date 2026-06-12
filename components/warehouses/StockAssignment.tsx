"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { Input }      from "@/components/ui/Input";
import { Select }     from "@/components/ui/Select";
import { Button }     from "@/components/ui/Button";
import { Badge }      from "@/components/ui/Badge";
import { Spinner }    from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/Feedback";
import { Modal }      from "@/components/ui/Modal";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import {
  GET_WAREHOUSE_STOCK, ASSIGN_STOCK, ADJUST_STOCK, REMOVE_STOCK,
} from "@/lib/graphql/operations/warehouse";
import { GET_PRODUCTS } from "@/lib/graphql/operations/product";
import type { WarehouseStockItem, WarehouseZone } from "@/types/warehouse";
import type { Product } from "@/types/product";

// ─── Adjust modal ─────────────────────────────────────────────────────────────

function AdjustStockModal({
  item,
  warehouseId,
  onClose,
}: {
  item:        WarehouseStockItem;
  warehouseId: string;
  onClose:     () => void;
}) {
  const [qty,   setQty]   = useState(String(item.quantity));
  const [notes, setNotes] = useState("");
  const [err,   setErr]   = useState("");

  const refetch = [{ query: GET_WAREHOUSE_STOCK, variables: { warehouseId } }];

  const [adjustStock, { loading }] = useMutation(ADJUST_STOCK, {
    refetchQueries: refetch, onCompleted: onClose,
    onError: (e) => setErr(e.graphQLErrors[0]?.message ?? e.message),
  });
  const [removeStock, { loading: removing }] = useMutation(REMOVE_STOCK, {
    refetchQueries: refetch, onCompleted: onClose,
    onError: (e) => setErr(e.graphQLErrors[0]?.message ?? e.message),
  });

  return (
    <Modal open onClose={onClose} title="Adjust stock quantity" description={`${item.product.sku} — ${item.product.name}`}>
      <div className="space-y-4">
        <div className="rounded-md bg-gray-50 px-4 py-2 text-sm">
          <span className="text-gray-500">Current: </span>
          <span className="font-semibold">{item.quantity} {item.product.unitOfMeasure}</span>
          {item.reservedQty > 0 && <span className="ml-2 text-xs text-gray-400">({item.reservedQty} reserved)</span>}
        </div>
        <Input
          label="New quantity *"
          type="number"
          min="0"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          hint="Set the exact quantity currently in stock."
        />
        <Input
          label="Reason / notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Stocktake correction"
        />
        {err && <p className="text-sm text-red-600">{err}</p>}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700"
            loading={removing}
            onClick={() => removeStock({ variables: { stockId: item.id } })}
          >
            Remove record
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading || removing}>Cancel</Button>
            <Button
              loading={loading}
              onClick={() => {
                setErr("");
                const q = parseInt(qty, 10);
                if (isNaN(q) || q < 0) { setErr("Quantity must be a non-negative integer."); return; }
                adjustStock({ variables: { input: { stockId: item.id, quantity: q, notes: notes || undefined } } });
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Assign product modal ──────────────────────────────────────────────────────

function AssignProductModal({
  warehouseId,
  zones,
  onClose,
}: {
  warehouseId: string;
  zones:       Pick<WarehouseZone, "id" | "name" | "code">[];
  onClose:     () => void;
}) {
  const [search,    setSearch]    = useState("");
  const [productId, setProductId] = useState("");
  const [zoneId,    setZoneId]    = useState("");
  const [qty,       setQty]       = useState("0");
  const [err,       setErr]       = useState("");

  const { data, loading: loadingProducts } = useQuery(GET_PRODUCTS, {
    variables: { filter: { search: search || undefined, status: "ACTIVE" }, pagination: { page: 1, limit: 20 } },
    fetchPolicy: "cache-and-network",
  });

  const [assignStock, { loading }] = useMutation(ASSIGN_STOCK, {
    refetchQueries: [{ query: GET_WAREHOUSE_STOCK, variables: { warehouseId } }],
    onCompleted:    onClose,
    onError: (e) => setErr(e.graphQLErrors[0]?.message ?? e.message),
  });

  const products: Product[] = data?.products?.nodes ?? [];
  const zoneOptions = zones.map((z) => ({ value: z.id, label: `${z.code} — ${z.name}` }));

  return (
    <Modal open onClose={onClose} title="Assign product to warehouse" description="Set the initial stock quantity.">
      <div className="space-y-4">
        {/* Product search */}
        <div className="space-y-2">
          <Input
            label="Search product"
            placeholder="Type SKU or name…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setProductId(""); }}
          />
          {loadingProducts && <Spinner size="sm" />}
          {products.length > 0 && !productId && (
            <ul className="max-h-48 overflow-y-auto rounded-md border border-gray-200 bg-white">
              {products.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-blue-50"
                    onClick={() => { setProductId(p.id); setSearch(p.name); }}
                  >
                    <span className="font-mono text-xs text-gray-400">{p.sku}</span>
                    <span className="font-medium">{p.name}</span>
                    <Badge variant="default" className="ml-auto">{p.category.name}</Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Zone + quantity */}
        {zoneOptions.length > 0 && (
          <Select
            label="Zone (optional)"
            value={zoneId}
            options={zoneOptions}
            onChange={(e) => setZoneId(e.target.value)}
            placeholder="No zone / general area"
          />
        )}
        <Input
          label="Quantity *"
          type="number"
          min="0"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
        />

        {err && <p className="text-sm text-red-600">{err}</p>}

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            loading={loading}
            disabled={!productId}
            onClick={() => {
              setErr("");
              const q = parseInt(qty, 10);
              if (!productId)         { setErr("Please select a product."); return; }
              if (isNaN(q) || q < 0) { setErr("Quantity must be a non-negative integer."); return; }
              assignStock({ variables: { input: { productId, warehouseId, zoneId: zoneId || undefined, quantity: q } } });
            }}
          >
            Assign
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface StockAssignmentProps {
  warehouseId: string;
  zones:       Pick<WarehouseZone, "id" | "name" | "code">[];
}

export function StockAssignment({ warehouseId, zones }: StockAssignmentProps) {
  const [search,    setSearch]    = useState("");
  const [zoneFilter,setZoneFilter]= useState("");
  const [page,      setPage]      = useState(1);
  const [adjusting, setAdjusting] = useState<WarehouseStockItem | null>(null);
  const [assigning, setAssigning] = useState(false);

  const { data, loading } = useQuery(GET_WAREHOUSE_STOCK, {
    variables: {
      warehouseId,
      filter:     { search: search || undefined, zoneId: zoneFilter || undefined },
      pagination: { page, limit: 20 },
    },
  });

  const stock: WarehouseStockItem[]  = data?.warehouseStock?.nodes ?? [];
  const pageInfo                     = data?.warehouseStock?.pageInfo;
  const zoneOptions = zones.map((z) => ({ value: z.id, label: `${z.code} — ${z.name}` }));

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-56">
          <Input
            placeholder="Search SKU or name…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        {zoneOptions.length > 0 && (
          <div className="w-44">
            <Select
              placeholder="All zones"
              value={zoneFilter}
              options={zoneOptions}
              onChange={(e) => { setZoneFilter(e.target.value); setPage(1); }}
            />
          </div>
        )}
        <Button variant="outline" size="sm" onClick={() => setAssigning(true)}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Assign product
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : stock.length === 0 ? (
        <EmptyState title="No stock records" description="Assign products to this warehouse to track inventory." />
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">On Hand</TableHead>
                <TableHead className="text-right">Reserved</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {stock.map((item) => {
                const isLow = item.availableQty > 0 && item.availableQty <= item.product.reorderPoint;
                const isOut = item.availableQty === 0;
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs text-gray-500">{item.product.sku}</TableCell>
                    <TableCell className="font-medium text-gray-900">{item.product.name}</TableCell>
                    <TableCell>
                      {item.zone ? <Badge variant="info">{item.zone.code}</Badge> : <span className="text-xs text-gray-400">General</span>}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{item.product.category.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{item.quantity}</TableCell>
                    <TableCell className="text-right tabular-nums text-gray-400">{item.reservedQty}</TableCell>
                    <TableCell className={`text-right tabular-nums font-medium ${isOut ? "text-red-600" : isLow ? "text-yellow-600" : "text-green-700"}`}>
                      {item.availableQty}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setAdjusting(item)}>Adjust</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pageInfo && pageInfo.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
              <p className="text-sm text-gray-500">Page <b>{pageInfo.currentPage}</b> of <b>{pageInfo.totalPages}</b></p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={!pageInfo.hasPreviousPage} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={!pageInfo.hasNextPage}     onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {adjusting && (
        <AdjustStockModal item={adjusting} warehouseId={warehouseId} onClose={() => setAdjusting(null)} />
      )}
      {assigning && (
        <AssignProductModal warehouseId={warehouseId} zones={zones} onClose={() => setAssigning(false)} />
      )}
    </div>
  );
}
