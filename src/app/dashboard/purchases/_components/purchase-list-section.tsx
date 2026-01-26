"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { usePurchases } from "@/hooks/purchases/use-purchases";
import { formatCurrency, formatDate } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { AppPagination } from "@/components/app-pagination";

export function PurchaseListSection() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data: purchasesResult, isLoading } = usePurchases({ page, limit });
  const purchases = purchasesResult?.data ?? [];
  const meta = purchasesResult?.meta;

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Invoice</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead>Dicatat Oleh</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24 ml-auto" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                </TableRow>
              ))
            ) : purchases.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-32 text-center text-muted-foreground italic"
                >
                  Belum ada riwayat pembelian.
                </TableCell>
              </TableRow>
            ) : (
              purchases.map((purchase) => (
                <TableRow
                  key={purchase.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="font-mono font-medium">
                    {purchase.invoiceNumber}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(purchase.createdAt)}
                  </TableCell>
                  <TableCell>{purchase.supplier?.name || "-"}</TableCell>
                  <TableCell className="text-right font-semibold text-primary">
                    {formatCurrency(Number(purchase.totalAmount))}
                  </TableCell>
                  <TableCell>{purchase.user?.name || "-"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {meta && (
        <AppPagination
          currentPage={page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
          limit={limit}
          onLimitChange={setLimit}
        />
      )}
    </div>
  );
}
