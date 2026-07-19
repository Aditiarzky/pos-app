"use client";

import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Loader2, AlertTriangle, AlertCircle } from "lucide-react";

type Relation = { label: string; count: number };

interface RelationAwareDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Nama item yang akan dihapus, untuk ditampilkan di dialog */
  itemName: string;
  /** URL endpoint GET untuk cek relasi, misal "/api/categories/5/relations" */
  relationsUrl: string;
  /** Dipanggil saat user konfirmasi hapus */
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function RelationAwareDeleteDialog({
  open,
  onOpenChange,
  itemName,
  relationsUrl,
  onConfirm,
  isDeleting = false,
}: RelationAwareDeleteDialogProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [hasRelations, setHasRelations] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");

  useEffect(() => {
    if (!open) {
      setRelations([]);
      setHasRelations(false);
      setConfirmInput("");
      return;
    }
    setIsChecking(true);
    fetch(relationsUrl)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setHasRelations(json.data.hasRelations);
          setRelations(
            json.data.relations.filter((r: Relation) => r.count > 0),
          );
        }
      })
      .catch(() => {})
      .finally(() => setIsChecking(false));
  }, [open, relationsUrl]);

  const canConfirm =
    !isChecking && !isDeleting && (!hasRelations || confirmInput === "HAPUS");

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {hasRelations && (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            )}
            Hapus {itemName}?
          </AlertDialogTitle>

          {isChecking ? (
            <AlertDialogDescription className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Memeriksa relasi data...
            </AlertDialogDescription>
          ) : hasRelations ? (
            <div className="space-y-3 text-sm">
              <p className="text-destructive font-semibold">
                Data ini memiliki relasi yang akan ikut terhapus secara
                permanen:
              </p>
              <ul className="space-y-1 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                {relations.map((r) => (
                  <li key={r.label} className="flex justify-between">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="font-bold text-destructive">
                      {r.count.toLocaleString("id-ID")}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground">
                Ketik <strong>HAPUS</strong> untuk mengkonfirmasi penghapusan
                permanen.
              </p>
              <Input
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="Ketik HAPUS"
                className="border-destructive/50 focus-visible:ring-destructive"
              />
            </div>
          ) : (
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus <strong>{itemName}</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={!canConfirm}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Hapus Permanen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
