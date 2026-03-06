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
  console.log(customerId);
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
      <Card className="border-none bg-primary/5 shadow-none group">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-primary">
                {customer.name}
              </h2>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {customer.phone || "-"}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {customer.address || "-"}
                </div>
              </div>
            </div>
            <div className="p-3 bg-primary/10 rounded-2xl group-hover:scale-110 transition-transform">
              <User className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="shadow-sm border-rose-100 bg-rose-50/30">
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

        <Card className="shadow-sm border-blue-100 bg-blue-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-blue-600 flex items-center gap-2">
              <Briefcase className="h-3.5 w-3.5" /> Total Transaksi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-blue-700 tabular-nums">
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
          <Badge variant="outline" className="font-medium">
            Sisa: {formatCurrency(Number(customer.creditBalance))}
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
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-rose-100 text-rose-600"
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
