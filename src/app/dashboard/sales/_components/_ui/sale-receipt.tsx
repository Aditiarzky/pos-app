"use client";

import { SaleResponse } from "../../_types/sale-type";
import { formatCurrency, formatDate } from "@/lib/format";
import Barcode from "react-barcode";
import { forwardRef } from "react";
import { useGetStoreSetting } from "@/hooks/store-setting/use-setting";

interface SaleReceiptProps {
  sale: SaleResponse;
}

/**
 * Receipt component pakai inline styles agar kompatibel dengan react-to-print.
 * Tailwind CSS tidak ter-copy ke print iframe, jadi harus pakai inline.
 */
export const SaleReceipt = forwardRef<HTMLDivElement, SaleReceiptProps>(
  function SaleReceipt({ sale }, ref) {
    const { data: settingResult } = useGetStoreSetting();
    const setting = settingResult?.data;
    const storeName = setting?.storeName || "TOKO GUNUNG MURIA GROSIR SNACK";
    const storeAddress = setting?.address || "Sidorekso, Kudus";
    const storePhone = setting?.phone || "0812-3456-7890";
    const footerMessage = setting?.footerMessage || "Terima Kasih!";
    const receiptNote =
      setting?.receiptNote ||
      "Bawa nota ini untuk pengembalian barang.";

    const fontSans = "'Courier New', Courier, monospace";

    const flexBetween: React.CSSProperties = {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
    };

    const labelStyle: React.CSSProperties = {
      fontSize: "8px",
      color: "#999",
      textTransform: "uppercase",
      letterSpacing: "1.5px",
      margin: "0 0 2px 0",
    };

    const totalAfterDiscount =
      Number(sale.totalPrice) - Number(sale.totalBalanceUsed);

    return (
      <div
        ref={ref}
        className="print-content"
        style={{
          margin: "0 auto",
          backgroundColor: "#fff",
          color: "#111",
          fontFamily: fontSans,
          fontSize: "11px",
          lineHeight: "1.45",
          boxSizing: "border-box",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            padding: "16px 16px 14px",
            borderBottom: "1px solid #ebebeb",
            textAlign: "center",
          }}
        >
          {setting?.logoUrl ? (
            <div
              style={{
                width: "48px",
                height: "48px",
                backgroundImage: `url(${setting.logoUrl})`,
                backgroundSize: "contain",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                margin: "0 auto 8px",
              }}
              aria-label="Logo toko"
            />
          ) : null}

          <p
            style={{
              fontSize: "8px",
              letterSpacing: "3px",
              color: "#bbb",
              textTransform: "uppercase",
              margin: "0 0 5px 0",
            }}
          >
            Point of Sale
          </p>

          <h2
            style={{
              fontSize: "16px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              margin: "0 0 5px 0",
              lineHeight: 1.2,
              color: "#111",
            }}
          >
            {storeName}
          </h2>

          <p style={{ fontSize: "9px", margin: "1px 0", color: "#999" }}>
            {storeAddress}
          </p>
          <p style={{ fontSize: "9px", margin: "1px 0", color: "#999" }}>
            Telp: {storePhone}
          </p>
        </div>

        {/* ── Info Transaksi ── */}
        <div
          style={{
            padding: "12px 16px",
            background: "#fafafa",
            borderBottom: "1px solid #ebebeb",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <p style={labelStyle}>No. Faktur</p>
              <p
                style={{
                  fontWeight: 700,
                  fontSize: "11px",
                  margin: 0,
                  letterSpacing: "0.3px",
                }}
              >
                {sale.invoiceNumber}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={labelStyle}>Tanggal</p>
              <p style={{ fontSize: "10px", margin: 0 }}>
                {formatDate(sale.createdAt || new Date())}
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "10px",
            }}
          >
            <div>
              <p style={labelStyle}>Kasir</p>
              <p style={{ fontSize: "10px", margin: 0 }}>
                {sale.user?.name?.split(" ")[0] || "Admin"}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={labelStyle}>Customer</p>
              <p style={{ fontSize: "10px", margin: 0 }}>
                {sale.customer?.name || "Guest"}
              </p>
            </div>
          </div>
        </div>

        {/* ── Barcode ── */}
        <div
          style={{
            background: "#f5f5f5",
            borderBottom: "1px solid #ebebeb",
            display: "flex",
            justifyContent: "center",
            padding: "6px 0 2px",
          }}
        >
          <Barcode
            value={sale.invoiceNumber}
            format="CODE128"
            width={1.5}
            height={38}
            fontSize={8}
            lineColor="#111"
            background="#f5f5f5"
            textMargin={3}
            renderer="svg"
          />
        </div>

        {/* ── Items ── */}
        <div style={{ padding: "12px 16px 8px" }}>
          <p
            style={{
              fontSize: "8px",
              color: "#999",
              textTransform: "uppercase",
              letterSpacing: "2px",
              margin: "0 0 10px 0",
            }}
          >
            Item Pembelian
          </p>

          {sale.items?.map((item, idx) => (
            <div
              key={item.id}
              style={{
                marginBottom: idx < (sale.items?.length || 0) - 1 ? "9px" : "0",
              }}
            >
              <div style={flexBetween}>
                <span style={{ fontWeight: 700, fontSize: "11px" }}>
                  {item.product?.name}
                </span>
                <span style={{ fontWeight: 700, fontSize: "11px" }}>
                  {formatCurrency(Number(item.subtotal))}
                </span>
              </div>
              <div
                style={{ fontSize: "9.5px", color: "#999", marginTop: "1px" }}
              >
                {Number(item.qty).toFixed(0)} pcs &times;{" "}
                {formatCurrency(Number(item.priceAtSale))}
                {item.productVariant?.name && (
                  <span style={{ fontStyle: "italic" }}>
                    {" "}
                    &nbsp;&middot;&nbsp; {item.productVariant.name}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Subtotal & Diskon ── */}
        <div
          style={{
            margin: "0 16px",
            borderTop: "1px solid #ebebeb",
            padding: "9px 0",
          }}
        >
          <div
            style={{
              ...flexBetween,
              fontSize: "10px",
              color: "#888",
              marginBottom: "4px",
            }}
          >
            <span>Subtotal</span>
            <span>{formatCurrency(Number(sale.totalPrice))}</span>
          </div>

          {Number(sale.totalBalanceUsed) > 0 && (
            <div style={{ ...flexBetween, fontSize: "10px", color: "#888" }}>
              <span>Voucher / Saldo</span>
              <span>- {formatCurrency(Number(sale.totalBalanceUsed))}</span>
            </div>
          )}
        </div>

        {/* ── TOTAL box ── */}
        <div style={{ padding: "0 16px 10px" }}>
          <div
            style={{
              border: "2px solid #111",
              borderRadius: "8px",
              padding: "10px 14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "9px",
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "#888",
              }}
            >
              Total
            </span>
            <span
              style={{
                fontSize: "16px",
                fontWeight: 800,
                letterSpacing: "0.5px",
                color: "#111",
              }}
            >
              {formatCurrency(totalAfterDiscount)}
            </span>
          </div>
        </div>

        {/* ── Bayar & Kembali / Hutang ── */}
        <div style={{ padding: "0 16px 12px" }}>
          <div
            style={{
              ...flexBetween,
              fontSize: "10px",
              color: "#888",
              marginBottom: "4px",
            }}
          >
            <span>Tunai</span>
            <span>{formatCurrency(Number(sale.totalPaid))}</span>
          </div>

          {sale.status === "debt" ? (
            <div
              style={{
                ...flexBetween,
                fontSize: "10.5px",
                fontWeight: 700,
                borderLeft: "2px solid #111",
                borderRadius: 0,
                paddingLeft: "8px",
              }}
            >
              <span>Sisa Hutang</span>
              <span>
                {formatCurrency(Math.abs(Number(sale.debt?.remainingAmount)))}
              </span>
            </div>
          ) : (
            <div
              style={{
                ...flexBetween,
                fontSize: "10.5px",
                fontWeight: 700,
              }}
            >
              <span>Kembali</span>
              <span>{formatCurrency(Number(sale.totalReturn))}</span>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            background: "#f5f5f5",
            borderTop: "1px solid #ebebeb",
            padding: "12px 16px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontWeight: 800,
              fontSize: "11px",
              letterSpacing: "0.5px",
              margin: "0 0 4px 0",
              color: "#111",
            }}
          >
            {footerMessage}
          </p>
          <p
            style={{
              fontSize: "8.5px",
              color: "#999",
              lineHeight: "1.5",
              margin: "0 0 8px 0",
            }}
          >
            {receiptNote}
          </p>
          <p
            style={{
              fontSize: "8px",
              color: "#ccc",
              letterSpacing: "0.5px",
              margin: 0,
            }}
          >
            {storeName} POS
          </p>
        </div>
      </div>
    );
  },
);
