"use client";

import { Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AccessDeniedProps {
  title?: string;
  description?: string;
}

export function AccessDenied({
  title = "Akses Ditolak",
  description = "Anda tidak memiliki izin untuk mengakses halaman ini.",
}: AccessDeniedProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-destructive" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {description}
        </CardContent>
      </Card>
    </div>
  );
}
