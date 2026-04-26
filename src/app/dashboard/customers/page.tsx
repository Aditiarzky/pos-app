"use client";

import { Suspense, useState } from "react";
import { Loader2, Users } from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CustomerListSection } from "./_components/customer-list-section";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CustomerForm } from "./_components/customer-form";
import {
  CustomerResponse,
  CustomerAnalytics,
} from "@/services/customerService";
import { useCustomers } from "@/hooks/master/use-customers";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { CardBg } from "@/assets/card-background/card-bg";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, CreditCard, UserPlus } from "lucide-react";
import { StickyCardStack } from "@/components/ui/sticky-card-wrapper";
import { useDebounce } from "@/hooks/use-debounce";
import { RoleGuard } from "@/components/role-guard";
import { AccessDenied } from "@/components/access-denied";

function AnalyticsCards({ analytics }: { analytics?: CustomerAnalytics }) {
  return (
    <StickyCardStack className="animate-in fade-in slide-in-from-top-4 duration-500">
      {/* Total Pelanggan */}
      <Card className="relative overflow-hidden border-none shadow-md">
        <CardBg />
        <CardHeader className="pb-2 z-10">
          <CardTitle className="text-sm font-medium flex items-center justify-between text-muted-foreground">
            Total Pelanggan
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="z-10 pt-0 text-primary">
          <div className="text-2xl font-bold">
            <AnimatedNumber value={analytics?.totalCustomers ?? 0} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 font-medium italic opacity-60">
            Pelanggan aktif terdaftar
          </p>
        </CardContent>
      </Card>

      {/* Total Piutang */}
      <Card className="relative overflow-hidden border-none shadow-md">
        <CardBg />
        <CardHeader className="pb-2 z-10">
          <CardTitle className="text-sm font-medium flex items-center justify-between text-muted-foreground">
            Total Piutang
            <div className="p-2 bg-rose-500/10 rounded-lg">
              <Wallet className="h-4 w-4 text-rose-500" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="z-10 pt-0 text-primary">
          <div className="text-2xl font-bold flex items-baseline gap-1">
            <span className="text-sm font-medium opacity-70">Rp</span>
            <AnimatedNumber value={analytics?.totalDebt ?? 0} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 font-medium italic opacity-60">
            Hutang pelanggan yang belum lunas
          </p>
        </CardContent>
      </Card>

      {/* Saldo Simpanan */}
      <Card className="relative overflow-hidden border-none shadow-md">
        <CardBg />
        <CardHeader className="pb-2 z-10">
          <CardTitle className="text-sm font-medium flex items-center justify-between text-muted-foreground">
            Saldo Simpanan
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <CreditCard className="h-4 w-4 text-emerald-500" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="z-10 pt-0 text-primary">
          <div className="text-2xl font-bold flex items-baseline gap-1">
            <span className="text-sm font-medium opacity-70">Rp</span>
            <AnimatedNumber value={analytics?.totalBalance ?? 0} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 font-medium italic opacity-60">
            Total saldo mengendap pelanggan
          </p>
        </CardContent>
      </Card>

      {/* Pelanggan Baru */}
      <Card className="relative overflow-hidden border-none shadow-md">
        <CardBg />
        <CardHeader className="pb-2 z-10">
          <CardTitle className="text-sm font-medium flex items-center justify-between text-muted-foreground">
            Pelanggan Baru
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <UserPlus className="h-4 w-4 text-blue-500" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="z-10 pt-0 text-primary">
          <div className="text-2xl font-bold">
            <AnimatedNumber value={analytics?.newCustomersToday ?? 0} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 font-medium italic opacity-60">
            Terdaftar hari ini
          </p>
        </CardContent>
      </Card>
    </StickyCardStack>
  );
}

function CustomersContent() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] =
    useState<CustomerResponse | null>(null);

  const { data: analyticData } = useCustomers();
  const analytics = analyticData?.analytics;

  const handleEdit = (customer: CustomerResponse) => {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingCustomer(null);
    setIsFormOpen(true);
  };

  return (
    <>
      <header className="sticky top-6 mx-auto container z-10 flex flex-row px-4 sm:px-6 justify-between w-full items-center gap-4 pb-16">
        <div className="flex items-center gap-4">
          <div className="h-12 w-1.5 bg-primary rounded-app-pill shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
          <div className="flex flex-col">
            <h1 className="text-3xl text-primary font-bold tracking-tight">
              Pelanggan
            </h1>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest opacity-80">
              Database Pelanggan • Riwayat Piutang
            </p>
          </div>
        </div>
        <div>
          <Button
            onClick={handleAdd}
            className="bg-gradient-to-br from-primary to-green-600 dark:to-green-400 hover:brightness-90 rounded-app-lg"
          >
            <Plus className="mr-0 sm:mr-2 h-4 w-4" />
            <p className="hidden sm:block">Tambah Pelanggan</p>
          </Button>
        </div>
      </header>

      <main className="relative z-10 -mt-12 container bg-background shadow-[0_-3px_5px_-1px_rgba(0,0,0,0.1)] rounded-t-4xl mx-auto p-4 space-y-6 min-h-screen border-t">
        <AnalyticsCards analytics={analytics} />

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <SearchInput
            placeholder="Cari nama atau telepon..."
            value={searchInput}
            onChange={setSearchInput}
          />
        </div>

        <CustomerListSection
          searchInput={debouncedSearch}
          onEdit={handleEdit}
        />

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? "Edit Pelanggan" : "Tambah Pelanggan Baru"}
              </DialogTitle>
            </DialogHeader>
            <CustomerForm
              initialData={editingCustomer}
              onSuccess={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
}

export default function CustomersPage() {
  return (
    <RoleGuard
      allowedRoles={["admin toko", "admin sistem"]}
      fallback={<AccessDenied />}
    >
      <Suspense
        fallback={
          <div className="container mx-auto p-4 flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <CustomersContent />
      </Suspense>
    </RoleGuard>
  );
}
