import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adjustProductStock } from "@/services/productService";
import { VariantAdjustmentInput } from "@/lib/validations/stock-adjustment";
import { toast } from "sonner";
import { notificationKeys } from "@/hooks/notifications/use-notifications";

export function useAdjustStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: { id: number } & VariantAdjustmentInput) =>
      adjustProductStock(args),
    onSuccess: (response) => {
      toast.success(response.message || "Stok berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["stock-mutations"] });
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
