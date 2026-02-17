import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconSortAscending, IconSortDescending } from "@tabler/icons-react";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

interface MutationFilterFormProps {
  typeFilter: string;
  setTypeFilter: (v: string) => void;
  orderBy: string;
  setOrderBy: (v: string) => void;
  order: "asc" | "desc";
  setOrder: (v: "asc" | "desc") => void;
  setPage: (p: number) => void;
  isDropdown?: boolean;
}

export const MutationFilterForm = ({
  typeFilter,
  setTypeFilter,
  orderBy,
  setOrderBy,
  order,
  setOrder,
  setPage,
  isDropdown,
}: MutationFilterFormProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className="font-medium leading-none text-xs text-muted-foreground uppercase tracking-wider">
          Tipe Mutasi
        </h4>
        <Select
          value={typeFilter}
          onValueChange={(v) => {
            setTypeFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full h-10 px-3 bg-muted/50 border-none shadow-none">
            <SelectValue placeholder="Semua Tipe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe</SelectItem>
            <SelectItem value="purchase">Pembelian</SelectItem>
            <SelectItem value="purchase_cancel">Batal Beli</SelectItem>
            <SelectItem value="sale">Penjualan</SelectItem>
            <SelectItem value="sale_cancel">Batal Jual</SelectItem>
            <SelectItem value="adjustment">Penyesuaian</SelectItem>
            <SelectItem value="waste">Terbuang/Rusak</SelectItem>
            <SelectItem value="return_restock">Retur (Restock)</SelectItem>
            <SelectItem value="supplier_return">Retur ke Supplier</SelectItem>
            <SelectItem value="exchange">Tukar Barang</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium leading-none text-xs text-muted-foreground uppercase tracking-wider">
          Urutkan
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={orderBy}
            onValueChange={(v) => {
              setOrderBy(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 px-3 bg-muted/50 border-none shadow-none">
              <SelectValue placeholder="Urutkan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Tanggal</SelectItem>
              <SelectItem value="name">Nama Produk</SelectItem>
              <SelectItem value="qty">Jumlah</SelectItem>
              <SelectItem value="reference">Referensi</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={order}
            onValueChange={(v) => {
              setOrder(v as "asc" | "desc");
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 px-3 bg-muted/50 border-none shadow-none">
              <SelectValue placeholder="A-Z" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">
                Ascending <IconSortAscending className="h-4 w-4" />
              </SelectItem>
              <SelectItem value="desc">
                Descending <IconSortDescending className="h-4 w-4" />
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isDropdown && <DropdownMenuSeparator />}
      <Button
        variant="ghost"
        className="w-full h-10 text-xs font-semibold text-muted-foreground"
        onClick={() => {
          setTypeFilter("all");
          setOrderBy("createdAt");
          setOrder("desc");
          setPage(1);
        }}
      >
        Reset Filter
      </Button>
    </div>
  );
};
