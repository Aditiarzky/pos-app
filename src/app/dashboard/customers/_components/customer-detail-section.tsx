"use client";

import { useCustomerDetail } from "@/hooks/master/use-customers";
import { formatCurrency, formatDate } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Phone,
  MapPin,
  Wallet,
  History,
  Briefcase,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { CustomerBalanceMutation } from "@/services/customerService";

interface CustomerDetailSectionProps {
  customerId: number;
}

export function CustomerDetailSection({
  customerId,
}: CustomerDetailSectionProps) {
  const { data, isLoading } = useCustomerDetail({ id: customerId });
  const customer = data?.data;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        Data tidak ditemukan.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Basic Info Card */}
      <Card className="border-none bg-primary/0 p-2 shadow-none group overflow-hidden ">
        <CardContent className="px-0">
          <div className="flex items-start justify-between gap-4">
            {/* Kolom Informasi */}
            <div className="space-y-3 flex-1">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold uppercase text-primary leading-none">
                  {customer.name}
                </h2>
                {/* Badge atau status tambahan bisa ditaruh di sini jika ada (contoh: 'Regular Customer') */}
              </div>

              {/* Metadata: Hanya muncul jika salah satu ada */}
              {(customer.phone || customer.address) ? (
                <div className="flex flex-col gap-2 text-sm text-muted-foreground/80">
                  {customer.phone && (
                    <div className="flex items-center gap-2 group/info">
                      <div className="p-1 rounded bg-primary/10 text-primary">
                        <Phone className="h-3 w-3" />
                      </div>
                      <span className="group-hover/info:text-primary transition-colors">
                        {customer.phone}
                      </span>
                    </div>
                  )}

                  {customer.address && (
                    <div className="flex items-start gap-2 group/info">
                      <div className="p-1 rounded bg-primary/10 text-primary mt-0.5">
                        <MapPin className="h-3 w-3" />
                      </div>
                      <span className="group-hover/info:text-primary transition-colors line-clamp-2">
                        {customer.address}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                /* Fallback jika benar-benar kosong agar card tidak terlihat 'patah' */
                <p className="text-xs italic text-muted-foreground/50">
                  Tidak ada detail kontak tersedia
                </p>
              )}
            </div>

            {/* Avatar/Icon Section */}
            <div className="relative shrink-0">
              <div className="p-4 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/20 group-hover:scale-105 transition-all duration-300">
                <User className="h-6 w-6" />
              </div>
              {/* Dekorasi tambahan untuk mengisi ruang visual */}
              <div className="absolute -z-10 inset-0 bg-primary/20 blur-xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-none border-destructive/10 bg-destructive/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-rose-600 flex items-center gap-2">
              <Wallet className="h-3.5 w-3.5" /> Total Hutang
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-rose-700 tabular-nums">
              {formatCurrency(customer.totalDebt)}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none border-blue-500/10 bg-blue-500/10 ">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-blue-500 flex items-center gap-2">
              <Wallet className="h-3.5 w-3.5" /> Saldo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-blue-500 tabular-nums">
              {formatCurrency(Number(customer.creditBalance))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none border-primary/10 bg-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-primary flex items-center gap-2">
              <Briefcase className="h-3.5 w-3.5" /> Total Transaksi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-primary tabular-nums">
              {customer.totalSales}{" "}
              <span className="text-xs font-normal">Kali</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Mutation History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <History className="h-4 w-4" /> Riwayat Mutasi Simpanan
          </h3>
          <Badge variant="outline" className="font-medium text-blue-500 border-blue-500/10 bg-blue-500/10">
            Saldo: {formatCurrency(Number(customer.creditBalance))}
          </Badge>
        </div>

        <div className="space-y-3">
          {customer.mutations?.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-lg">
              Belum ada riwayat mutasi.
            </div>
          ) : (
            customer.mutations.map((mutation: CustomerBalanceMutation) => (
              <div
                key={mutation.id}
                className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${Number(mutation.amount) > 0
                      ? "bg-primary/10 text-primary"
                      : "bg-destructive/10 text-destructive"
                      }`}
                  >
                    {Number(mutation.amount) > 0 ? (
                      <ArrowDownLeft className="h-4 w-4" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold capitalize">
                      {mutation.type.replace(/_/g, " ")}
                    </div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(mutation.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-sm font-black ${Number(mutation.amount) > 0
                      ? "text-emerald-600"
                      : "text-rose-600"
                      }`}
                  >
                    {Number(mutation.amount) > 0 ? "+" : ""}
                    {formatCurrency(Number(mutation.amount))}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Saldo: {formatCurrency(Number(mutation.balanceAfter))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
