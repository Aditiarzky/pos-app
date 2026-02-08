"use client";

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

interface UserFilterFormProps {
  roleFilter: string;
  setRoleFilter: (v: string) => void;
  orderBy: string;
  setOrderBy: (v: string) => void;
  order: string;
  setOrder: (v: "asc" | "desc") => void;
  setPage: (p: string) => void;
  isDropdown?: boolean;
}

export const UserFilterForm = ({
  roleFilter,
  setRoleFilter,
  orderBy,
  setOrderBy,
  order,
  setOrder,
  setPage,
  isDropdown,
}: UserFilterFormProps) => {
  const content = (
    <div className="space-y-4">
      {/* Filter Role */}
      <div className="space-y-2">
        <h4 className="font-medium leading-none text-xs text-muted-foreground uppercase tracking-wider">
          Filter Role
        </h4>
        <Select
          value={roleFilter}
          onValueChange={(v) => {
            setRoleFilter(v);
            setPage("1");
          }}
        >
          <SelectTrigger className="w-full h-10 px-3 bg-muted/50 border-none shadow-none focus:ring-1 focus:ring-primary/20">
            <SelectValue placeholder="Semua Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Role</SelectItem>
            <SelectItem value="admin toko">Admin Toko</SelectItem>
            <SelectItem value="admin sistem">Admin Sistem</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sorting */}
      <div className="space-y-2">
        <h4 className="font-medium leading-none text-xs text-muted-foreground uppercase tracking-wider">
          Urutkan Berdasarkan
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={orderBy}
            onValueChange={(v) => {
              setOrderBy(v);
              setPage("1");
            }}
          >
            <SelectTrigger className="h-10 px-3 bg-muted/50 border-none shadow-none focus:ring-1 focus:ring-primary/20">
              <SelectValue placeholder="Urutkan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Tanggal Dibuat</SelectItem>
              <SelectItem value="name">Nama</SelectItem>
              <SelectItem value="email">Email</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={order}
            onValueChange={(v: "asc" | "desc") => {
              setOrder(v);
              setPage("1");
            }}
          >
            <SelectTrigger className="h-10 px-3 bg-muted/50 border-none shadow-none focus:ring-1 focus:ring-primary/20">
              <SelectValue placeholder="Urutan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">
                A-Z <IconSortAscending className="h-4 w-4 ml-2 inline" />
              </SelectItem>
              <SelectItem value="desc">
                Z-A <IconSortDescending className="h-4 w-4 ml-2 inline" />
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
          setRoleFilter("all");
          setOrderBy("createdAt");
          setOrder("desc");
          setPage("1");
        }}
      >
        Reset Filter
      </Button>
    </div>
  );

  return content;
};
