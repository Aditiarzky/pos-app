"use client";

import { formatCurrency, formatDate } from "@/lib/format";
import { forwardRef } from "react";
import { ReturnResult } from "../../_hooks/use-return-form";
import Barcode from "react-barcode";
import { useGetStoreSetting } from "@/hooks/store-setting/use-setting";

interface ReturnReceiptProps {
  result: ReturnResult;
}

export const ReturnReceipt = forwardRef<HTMLDivElement, ReturnReceiptProps>(
  function ReturnReceipt({ result }, ref) {
    const { data: settingResult } = useGetStoreSetting();
    const setting = settingResult?.data;
    const storeName = setting?.storeName || "TOKO GUNUNG MURIA GROSIR SNACK";
    const storeAddress = setting?.address || "Sidorekso, Kudus";
    const storePhone = setting?.phone || "0812-3456-7890";
    const footerMessage = setting?.footerMessage || "Terima Kasih!";
    const receiptNote = "Pengembalian barang diproses sesuai dengan ketentuan.";

    const compensationLabel =
      result.compensationType === "refund"
        ? "REFUND TUNAI"
        : result.compensationType === "credit_note"
          ? "SALDO PELANGGAN"
          : "TUKAR BARANG";

    const isRefundPositive = result.netRefundAmount >= 0;
    const totalAfterExchange = Math.abs(result.netRefundAmount);

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

          <p style={{ fontSize: "9px", margin: "1px 0" }}>
            {storeAddress}
          </p>
          <p style={{ fontSize: "9px", margin: "1px 0" }}>
            Telp: {storePhone}
          </p>
        </div>

        <div style={divider} />

        {/* ── Info Retur ── */}
        <div style={{ paddingBottom: "4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <p style={labelStyle}>No. Retur</p>
              <p
                style={{
                  fontWeight: 700,
                  fontSize: "11px",
                  margin: 0,
                }}
              >
                {result.returnNumber}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={labelStyle}>Tanggal</p>
              <p style={{ fontSize: "10px", margin: 0 }}>
                {formatDate(new Date())}
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
              <p style={labelStyle}>Invoice</p>
              <p style={{ fontSize: "10px", margin: 0 }}>
                {result.saleData.invoiceNumber || "-"}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={labelStyle}>Customer</p>
              <p style={{ fontSize: "10px", margin: 0 }}>
                {result.customerName || "Guest"}
              </p>
            </div>
          </div>

          <div style={{ marginTop: "6px" }}>
            <p style={labelStyle}>Kompensasi</p>
            <p style={{ fontSize: "10px", margin: 0 }}>{compensationLabel}</p>
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
            value={result.returnNumber}
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
            Item Retur
          </p>

          {result.returnItems.map((item, idx) => (
            <div
              key={`${item.variantId}-${idx}`}
              style={{
                marginBottom:
                  idx < (result.returnItems?.length || 0) - 1 ? "6px" : "0",
              }}
            >
              <div style={flexBetween}>
                <span style={{ fontWeight: 700, fontSize: "11px" }}>
                  {item.productName}
                </span>
                <span style={{ fontWeight: 700, fontSize: "11px" }}>
                  {formatCurrency(
                    item.qty * (item.priceAtSale || item.priceAtReturn || 0),
                  )}
                </span>
              </div>
              <div
                style={{ fontSize: "9.5px", marginTop: "1px" }}
              >
                {Number(item.qty).toFixed(0)} pcs &times;{" "}
                {formatCurrency(item.priceAtSale || item.priceAtReturn || 0)}
                {item.variantName && (
                  <span style={{ fontStyle: "italic" }}>
                    {" "}
                    &middot; {item.variantName}
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: "9px",
                  marginTop: "1px",
                  fontStyle: "italic",
                }}
              >
                {item.returnedToStock
                  ? "Restock"
                  : "Waste / Tidak kembali ke stok"}
              </div>
            </div>
          ))}

          {result.exchangeItems.length > 0 && (
            <>
              <p
                style={{
                  fontSize: "8px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  margin: "8px 0 6px 0",
                }}
              >
                Item Pengganti
              </p>

              {result.exchangeItems.map((item, idx) => (
                <div
                  key={`${item.variantId}-${idx}`}
                  style={{
                    marginBottom:
                      idx < (result.exchangeItems?.length || 0) - 1
                        ? "6px"
                        : "0",
                  }}
                >
                  <div style={flexBetween}>
                    <span style={{ fontWeight: 700, fontSize: "11px" }}>
                      {item.productName}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: "11px" }}>
                      -{formatCurrency(item.qty * item.sellPrice)}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "9.5px",
                      marginTop: "1px",
                    }}
                  >
                    {Number(item.qty).toFixed(0)} pcs &times;{" "}
                    {formatCurrency(item.sellPrice)}
                    {item.variantName && (
                      <span style={{ fontStyle: "italic" }}>
                        {" "}
                        &middot; {item.variantName}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* ── Subtotal ── */}
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
            <span>{formatCurrency(result.totalValueReturned)}</span>
          </div>

          {result.exchangeItems.length > 0 && (
            <div style={{ ...flexBetween, fontSize: "10px" }}>
              <span>Potongan Tukar Barang</span>
              <span>- {formatCurrency(result.totalValueExchange)}</span>
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
              {isRefundPositive ? "Sisa Refund" : "Kekurangan"}
            </span>
            <span
              style={{
                fontSize: "15px",
                fontWeight: 900,
                letterSpacing: "0.5px",
              }}
            >
              {formatCurrency(totalAfterExchange)}
            </span>
          </div>
        </div>

        {/* ── Kompensasi Info ── */}
        <div style={{ paddingBottom: "6px" }}>
          <div
            style={{
              ...flexBetween,
              fontSize: "10px",
              marginBottom: "3px",
            }}
          >
            <span>Kompensasi</span>
            <span>{compensationLabel}</span>
          </div>
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
