"use client";

import { Wifi, WifiOff, RefreshCw, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOfflineProductSearch } from "@/hooks/use-offline-product-search";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function OfflineCatalogStatus() {
  const { isOffline, lastUpdated, isSyncing, syncCatalog } = useOfflineProductSearch();

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 border border-border rounded-xl text-sm transition-all duration-200">
        {/* Status Online/Offline */}
        {isOffline ? (
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
            <div className="relative">
              <WifiOff className="h-4 w-4" />
              <div className="absolute inset-0 bg-orange-500/20 rounded-full animate-ping" />
            </div>
            <span className="font-medium">Offline</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <Wifi className="h-4 w-4" />
            <span className="font-medium">Online</span>
          </div>
        )}

        {/* Katalog Info */}
        <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          {lastUpdated ? (
            <span className="text-muted-foreground">
              Terakhir diperbarui: {lastUpdated}
            </span>
          ) : (
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              Katalog belum disinkronisasi
            </span>
          )}
        </div>

        {/* Sync Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={syncCatalog}
          disabled={isSyncing || isOffline}
          className={cn(
            "ml-auto h-8 px-3 transition-all duration-200",
            isSyncing && "opacity-50",
            isOffline && "opacity-50 cursor-not-allowed",
            "hover:bg-primary/10 hover:text-primary"
          )}
          title={isOffline ? "Tidak bisa sinkronisasi saat offline" : "Sinkronisasi katalog offline"}
        >
          <RefreshCw className={cn("h-4 w-4 mr-1.5", isSyncing && "animate-spin")} />
          {isSyncing ? "Sinkronisasi..." : "Sinkronisasi"}
        </Button>

        {/* Offline Warning */}
        {isOffline && (
          <div className="ml-2">
            <Tooltip>
              <TooltipTrigger>
                <AlertCircle className="h-4 w-4 text-orange-500" />
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Batal online. Anda bisa menggunakan katalog offline yang sudah disinkronisasi sebelumnya.</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
