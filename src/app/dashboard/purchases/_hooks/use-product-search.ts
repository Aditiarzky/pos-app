"use client";

import { useState, useRef, useEffect } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { useProducts } from "@/hooks/products/use-products";
import { ProductResponse } from "@/services/productService";
import { toast } from "sonner";

// ============================================
// HOOK RETURN TYPE
// ============================================

interface UseProductSearchReturn {
  // Search state
  searchInput: string;
  setSearchInput: (value: string) => void;
  debouncedSearch: string;

  // Search results
  searchResults: ProductResponse[];
  isSearching: boolean;

  // Scanner state
  isScannerOpen: boolean;
  openScanner: () => void;
  closeScanner: () => void;
  handleScanSuccess: (barcode: string) => void;

  // Input ref
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  focusSearchInput: () => void;
  clearSearch: () => void;
}

// ============================================
// HOOK PROPS TYPE
// ============================================

interface UseProductSearchProps {
  minSearchLength?: number;
  searchLimit?: number;
  autoFocusOnMount?: boolean;
  isOpen?: boolean;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useProductSearch({
  minSearchLength = 2,
  searchLimit = 10,
  autoFocusOnMount = true,
  isOpen,
}: UseProductSearchProps = {}): UseProductSearchReturn {
  // Search state
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);

  // Scanner state
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Input ref
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch products ketika ada search query
  const { data: productsResult, isLoading: isSearching } = useProducts({
    params: {
      search: debouncedSearch,
      limit: searchLimit,
    },
    queryConfig: {
      enabled: debouncedSearch.length >= minSearchLength,
    },
  });

  const searchResults = productsResult?.data ?? [];

  // Clear search input when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchInput("");
    }
  }, [isOpen]);

  // Auto focus on open
  useEffect(() => {
    if (isOpen && autoFocusOnMount) {
      searchInputRef.current?.focus();
    }
  }, [isOpen, autoFocusOnMount]);

  // Scanner handlers
  const openScanner = () => setIsScannerOpen(true);
  const closeScanner = () => setIsScannerOpen(false);

  const handleScanSuccess = (barcode: string) => {
    closeScanner();
    setSearchInput(barcode);
    toast.success("Barcode berhasil dipindai");
  };

  // Helper functions
  const focusSearchInput = () => {
    searchInputRef.current?.focus();
  };

  const clearSearch = () => {
    setSearchInput("");
    focusSearchInput();
  };

  return {
    // Search state
    searchInput,
    setSearchInput,
    debouncedSearch,

    // Search results
    searchResults,
    isSearching,

    // Scanner state
    isScannerOpen,
    openScanner,
    closeScanner,
    handleScanSuccess,

    // Input ref
    searchInputRef,
    focusSearchInput,
    clearSearch,
  };
}
