"use client";

import Link from "next/link";
import { WifiOff, RefreshCw, ShoppingCart } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <WifiOff className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Koneksi Internet Terputus
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Aplikasi sedang berada dalam mode offline. Anda tetap dapat membuka halaman kasir untuk melanjutkan transaksi yang tersimpan secara lokal.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-medium text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Coba Lagi
          </button>

          <Link
            href="/dashboard/sales"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium text-sm transition-colors shadow-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            Buka Kasir
          </Link>
        </div>
      </div>
    </div>
  );
}
