import { CategoryResponse } from "@/services/categoryService";
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

interface FilterFormProps {
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  categories: CategoryResponse[];
  stockFilter: string;
  setStockFilter: (v: "all" | "low" | "normal") => void;
  orderBy: string;
  setOrderBy: (v: string) => void;
  order: string;
  setOrder: (v: "asc" | "desc") => void;
  setPage: (p: number) => void;
  isDropdown?: boolean;
}

export const ProductFilterForm = ({
  categoryFilter,
  setCategoryFilter,
  categories,
  stockFilter,
  setStockFilter,
  orderBy,
  setOrderBy,
  order,
  setOrder,
  setPage,
  isDropdown,
}: FilterFormProps) => {
  const content = (
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className="font-medium leading-none text-xs text-muted-foreground uppercase tracking-wider">
          Filter Kategori
        </h4>
        <Select
          value={categoryFilter}
          onValueChange={(v) => {
            setCategoryFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full h-10 px-3 bg-muted/50 border-none shadow-none focus:ring-1 focus:ring-primary/20">
            <SelectValue placeholder="Semua Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {categories.map((cat: CategoryResponse) => (
              <SelectItem key={cat.id} value={cat.id.toString()}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <h4 className="font-medium leading-none text-xs text-muted-foreground uppercase tracking-wider">
          Status Stok
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {["all", "low", "normal"].map((v) => (
            <Button
              key={v}
              variant={stockFilter === v ? "default" : "outline"}
              size="sm"
              className="h-9 capitalize text-xs shadow-none border-muted"
              onClick={() => {
                setStockFilter(v as "all" | "low" | "normal");
                setPage(1);
              }}
            >
              {v === "all" ? "Semua" : v === "low" ? "Rendah" : "Normal"}
            </Button>
          ))}
        </div>
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
            <SelectTrigger className="h-10 px-3 bg-muted/50 border-none shadow-none focus:ring-1 focus:ring-primary/20">
              <SelectValue placeholder="Urutkan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Tanggal</SelectItem>
              <SelectItem value="name">Nama</SelectItem>
              <SelectItem value="stock">Stok</SelectItem>
              <SelectItem value="sku">SKU</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={order}
            onValueChange={(v: "asc" | "desc") => {
              setOrder(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 px-3 bg-muted/50 border-none shadow-none focus:ring-1 focus:ring-primary/20">
              <SelectValue placeholder="A-Z" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">
                Ascending <IconSortAscending className="h-4 w-4 ml-2 inline" />
              </SelectItem>
              <SelectItem value="desc">
                Descending{" "}
                <IconSortDescending className="h-4 w-4 ml-2 inline" />
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isDropdown && <DropdownMenuSeparator />}
      <Button
        variant="ghost"
        className="w-full h-10 text-xs font-semibold text-muted-foreground hover:text-foreground"
        onClick={() => {
          setCategoryFilter("all");
          setStockFilter("all");
          setOrderBy("createdAt");
          setOrder("desc");
          setPage(1);
        }}
      >
        Reset Filter
      </Button>
    </div>
  );

  return content;
};
