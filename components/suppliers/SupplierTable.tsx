"use client";

import Link from "next/link";
import { Badge }      from "@/components/ui/Badge";
import { Button }     from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Feedback";
import { Spinner }    from "@/components/ui/Spinner";
import {
  Table, TableHeader, TableBody,
  TableRow, TableHead, TableCell,
} from "@/components/ui/Table";
import { RoleGate } from "@/components/auth/RoleGate";
import type { Supplier, SupplierConnection } from "@/types/supplier";

const STATUS_VARIANT = {
  ACTIVE:      "success",
  INACTIVE:    "warning",
  BLACKLISTED: "danger",
} as const;

interface PaginationBarProps {
  pageInfo:     SupplierConnection["pageInfo"];
  onPageChange: (page: number) => void;
}

function PaginationBar({ pageInfo, onPageChange }: PaginationBarProps) {
  const { currentPage, totalPages, totalCount } = pageInfo;
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
      <p className="text-sm text-gray-500">
        Page <span className="font-medium">{currentPage}</span> of{" "}
        <span className="font-medium">{totalPages}</span> &mdash;{" "}
        <span className="font-medium">{totalCount}</span> suppliers
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={!pageInfo.hasPreviousPage} onClick={() => onPageChange(currentPage - 1)}>
          Previous
        </Button>
        <Button variant="outline" size="sm" disabled={!pageInfo.hasNextPage} onClick={() => onPageChange(currentPage + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}

interface SupplierTableProps {
  data:         SupplierConnection | undefined;
  loading:      boolean;
  onPageChange: (page: number) => void;
  onDelete:     (supplier: Supplier) => void;
}

export function SupplierTable({ data, loading, onPageChange, onDelete }: SupplierTableProps) {
  if (loading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }

  if (!data?.nodes.length) {
    return <EmptyState title="No suppliers found" description="Try adjusting your filters or add a new supplier." />;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>GST Number</TableHead>
            <TableHead className="text-right">Products</TableHead>
            <TableHead className="text-right">Payment Terms</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.nodes.map((supplier) => (
            <TableRow key={supplier.id}>
              <TableCell className="font-mono text-xs text-gray-500">{supplier.code}</TableCell>

              <TableCell>
                <Link
                  href={`/suppliers/${supplier.id}`}
                  className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {supplier.name}
                </Link>
              </TableCell>

              <TableCell className="text-sm text-gray-600">
                <div>{supplier.contactName ?? "—"}</div>
                {supplier.email && <div className="text-xs text-gray-400">{supplier.email}</div>}
                {supplier.phone && <div className="text-xs text-gray-400">{supplier.phone}</div>}
              </TableCell>

              <TableCell className="text-sm text-gray-600 font-mono text-xs">
                {supplier.gstNumber ?? "—"}
              </TableCell>

              <TableCell className="text-right tabular-nums text-sm">{supplier.productCount}</TableCell>

              <TableCell className="text-right tabular-nums text-sm text-gray-600">
                {supplier.paymentTerms}d
              </TableCell>

              <TableCell>
                <Badge variant={STATUS_VARIANT[supplier.status] ?? "default"}>
                  {supplier.status}
                </Badge>
              </TableCell>

              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Link href={`/suppliers/${supplier.id}/edit`}>
                    <Button variant="ghost" size="icon" title="Edit">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Button>
                  </Link>
                  <RoleGate permission="delete:suppliers">
                    <Button
                      variant="ghost" size="icon" title="Delete"
                      onClick={() => onDelete(supplier)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  </RoleGate>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <PaginationBar pageInfo={data.pageInfo} onPageChange={onPageChange} />
    </div>
  );
}
