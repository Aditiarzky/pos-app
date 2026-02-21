"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "../ui/sonner";
import NextTopLoader from "nextjs-toploader";

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <NextTopLoader />
      {children}
      <Toaster
        toastOptions={{
          classNames: {
            error: "bg-destructive text-white",
            success: "bg-primary text-white",
            warning: "text-yellow-400",
            info: "bg-secondary text-primary",
          },
        }}
        position="bottom-right"
      />
    </QueryClientProvider>
  );
}
