// src/hooks/use-product-search.ts
// atau src/_hooks/use-product-search.ts (sesuaikan struktur project kamu)

"use client";

import { useState, useRef, useEffect } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { useProducts } from "@/hooks/products/use-products";
import { ProductResponse } from "@/services/productService";
import { toast } from "sonner";

interface UseProductSearchProps {
    minSearchLength?: number;
    searchLimit?: number;
    autoFocusOnMount?: boolean;
    isOpen?: boolean;
}

interface UseProductSearchReturn {
    searchInput: string;
    setSearchInput: (value: string) => void;
    debouncedSearch: string;
    searchResults: ProductResponse[];
    isSearching: boolean;

    isScannerOpen: boolean;
    openScanner: () => void;
    closeScanner: () => void;
    handleScanSuccess: (barcode: string) => void;

    lastScannedBarcode: string | null;
    setLastScannedBarcode: (value: string | null) => void;

    searchInputRef: React.RefObject<HTMLInputElement | null>;
    focusSearchInput: () => void;
    clearSearch: () => void;
}

export function useProductSearch({
    minSearchLength = 0,
    searchLimit = 10,
    autoFocusOnMount = true,
    isOpen,
}: UseProductSearchProps = {}): UseProductSearchReturn {
    const [searchInput, setSearchInput] = useState("");
    const debouncedSearch = useDebounce(searchInput, 10); // lebih cepat untuk POS

    const searchInputRef = useRef<HTMLInputElement>(null);

    // ← PERBAIKAN UTAMA: pakai searchInput langsung supaya Enter langsung jalan
    const { data: productsResult, isFetching: isSearching } = useProducts({
        params: {
            search: searchInput, // penting!
            limit: searchLimit,
        },
        queryConfig: {
            enabled: searchInput.length >= minSearchLength,
        },
    });

    const searchResults = productsResult?.data ?? [];

    // Scanner
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(
        null,
    );

    // Auto focus
    useEffect(() => {
        if (isOpen && autoFocusOnMount) {
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
    }, [isOpen, autoFocusOnMount]);

    // Clear saat modal ditutup
    useEffect(() => {
        if (!isOpen) {
            setSearchInput("");
            setLastScannedBarcode(null);
        }
    }, [isOpen]);

    // Jika barcode sudah di-submit tapi hasil tetap kosong setelah request selesai
    useEffect(() => {
        if (!lastScannedBarcode) return;
        if (searchInput !== lastScannedBarcode) return;
        if (isSearching) return;
        if (searchResults.length > 0) return;

        setLastScannedBarcode(null);
        toast.error("Produk tidak ditemukan");
    }, [
        isSearching,
        lastScannedBarcode,
        searchInput,
        searchResults.length,
    ]);

    const openScanner = () => setIsScannerOpen(true);
    const closeScanner = () => setIsScannerOpen(false);

    const handleScanSuccess = (barcode: string) => {
        closeScanner();
        setSearchInput(barcode);
        setLastScannedBarcode(barcode);
        toast.success("Barcode berhasil dipindai");
    };

    const focusSearchInput = () => searchInputRef.current?.focus();

    const clearSearch = () => {
        setSearchInput("");
        setLastScannedBarcode(null);
        focusSearchInput();
    };

    return {
        searchInput,
        setSearchInput,
        debouncedSearch,
        searchResults,
        isSearching,

        isScannerOpen,
        openScanner,
        closeScanner,
        handleScanSuccess,

        lastScannedBarcode,
        setLastScannedBarcode,

        searchInputRef,
        focusSearchInput,
        clearSearch,
    };
}
