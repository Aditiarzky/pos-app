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
 * Receipt component pakai inline styles agar kompatibel dengan react-to-print
 * dan printer thermal 80mm.
 *
 * Thermal printer constraints:
 * - Hanya cetak hitam di atas putih (warna abu-abu TIDAK tercetak)
 * - Background color TIDAK tercetak
 * - CSS backgroundImage TIDAK tercetak (harus pakai <img>)
 * - border-radius mungkin tidak tercetak
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
      setting?.receiptNote || "Bawa nota ini untuk pengembalian barang.";

    const fontSans = "'Courier New', Courier, monospace";

    // ── Shared styles (thermal-safe: only black text, no bg, no radius) ──
    const flexBetween: React.CSSProperties = {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
    };

    const labelStyle: React.CSSProperties = {
      fontSize: "8px",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "1px",
      margin: "0 0 2px 0",
    };

    const divider: React.CSSProperties = {
      borderTop: "1px dashed #000",
      width: "100%",
      margin: "6px 0",
    };

    const totalAfterDiscount =
      Number(sale.totalPrice) - Number(sale.totalBalanceUsed);

    return (
      <div
        ref={ref}
        className="print-content"
        style={{
          margin: "0 auto",
          padding: "16px",
          backgroundColor: "#fff",
          color: "#000",
          fontFamily: fontSans,
          fontSize: "11px",
          lineHeight: "1.45",
          boxSizing: "border-box",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            paddingBottom: "6px",
            textAlign: "center",
          }}
        >
          {setting?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={setting.logoUrl}
              alt="Logo toko"
              style={{
                width: "48px",
                height: "48px",
                objectFit: "contain",
                margin: "0 auto 6px",
                display: "block",
              }}
            />
          ) : null}

          <h2
            style={{
              fontSize: "14px",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              margin: "0 0 3px 0",
              lineHeight: 1.2,
            }}
          >
            {storeName}
          </h2>

          <p style={{ fontSize: "9px", margin: "1px 0" }}>{storeAddress}</p>
          <p style={{ fontSize: "9px", margin: "1px 0" }}>Telp: {storePhone}</p>
        </div>

        <div style={divider} />

        {/* ── Info Transaksi ── */}
        <div style={{ paddingBottom: "4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <p style={labelStyle}>No. Faktur</p>
              <p
                style={{
                  fontWeight: 700,
                  fontSize: "11px",
                  margin: 0,
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
              marginTop: "6px",
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

        <div style={divider} />

        {/* ── Barcode ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "4px 0",
          }}
        >
          <Barcode
            value={sale.invoiceNumber}
            format="CODE128"
            width={1.5}
            height={38}
            fontSize={8}
            lineColor="#000"
            background="#fff"
            textMargin={3}
            renderer="svg"
          />
        </div>

        <div style={divider} />

        {/* ── Items ── */}
        <div style={{ paddingBottom: "4px" }}>
          <p
            style={{
              fontSize: "8px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "1px",
              margin: "0 0 6px 0",
            }}
          >
            Item Pembelian
          </p>

          {sale.items?.map((item, idx) => (
            <div
              key={item.id}
              style={{
                marginBottom: idx < (sale.items?.length || 0) - 1 ? "6px" : "0",
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
              <div style={{ fontSize: "9.5px", marginTop: "1px" }}>
                {Number(item.qty).toFixed(0)} pcs &times;{" "}
                {formatCurrency(Number(item.priceAtSale))}
                {item.productVariant?.name && (
                  <span style={{ fontStyle: "italic" }}>
                    {" "}
                    &middot; {item.productVariant.name}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Subtotal & Diskon ── */}
        <div
          style={{
            borderTop: "1px dashed #000",
            padding: "6px 0",
          }}
        >
          <div
            style={{
              ...flexBetween,
              fontSize: "10px",
              marginBottom: "3px",
            }}
          >
            <span>Subtotal</span>
            <span>{formatCurrency(Number(sale.totalPrice))}</span>
          </div>

          {Number(sale.totalBalanceUsed) > 0 && (
            <div style={{ ...flexBetween, fontSize: "10px" }}>
              <span>Voucher / Saldo</span>
              <span>- {formatCurrency(Number(sale.totalBalanceUsed))}</span>
            </div>
          )}
        </div>

        {/* ── TOTAL box ── */}
        <div style={{ padding: "6px 0" }}>
          <div
            style={{
              border: "2px solid #000",
              padding: "8px 10px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "9px",
                letterSpacing: "1px",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              Total
            </span>
            <span
              style={{
                fontSize: "15px",
                fontWeight: 900,
                letterSpacing: "0.5px",
              }}
            >
              {formatCurrency(totalAfterDiscount)}
            </span>
          </div>
        </div>

        {/* ── Bayar & Kembali / Hutang ── */}
        <div style={{ paddingBottom: "6px" }}>
          <div
            style={{
              ...flexBetween,
              fontSize: "10px",
              marginBottom: "3px",
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
                borderLeft: "2px solid #000",
                paddingLeft: "6px",
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

        <div style={divider} />

        {/* ── Footer ── */}
        <div
          style={{
            paddingTop: "4px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontWeight: 800,
              fontSize: "11px",
              letterSpacing: "0.5px",
              margin: "0 0 3px 0",
            }}
          >
            {footerMessage}
          </p>
          <p
            style={{
              fontSize: "8.5px",
              lineHeight: "1.5",
              margin: "0 0 6px 0",
            }}
          >
            {receiptNote}
          </p>
          <p
            style={{
              fontSize: "8px",
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
