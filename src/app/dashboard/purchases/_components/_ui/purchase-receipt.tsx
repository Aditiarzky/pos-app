"use client";

import { forwardRef } from "react";
import Barcode from "react-barcode";
import { formatCurrency, formatDate } from "@/lib/format";
import { PurchaseResponse } from "../../_types/purchase-type";
import { useGetStoreSetting } from "@/hooks/store-setting/use-setting";

interface PurchaseReceiptProps {
  purchase: PurchaseResponse;
}

export const PurchaseReceipt = forwardRef<HTMLDivElement, PurchaseReceiptProps>(
  function PurchaseReceipt({ purchase }, ref) {
    const { data: settingResult } = useGetStoreSetting();
    const setting = settingResult?.data;
    const storeName = setting?.storeName || "GUNUNG MURIA GROSIR SNACK";
    const storeAddress = setting?.address || "Jl. Raya No. 123, Kota ABC";
    const storePhone = setting?.phone || "0812-3456-7890";

    const dashedBorder = {
      borderTop: "1px dashed #000",
      width: "100%",
      margin: "8px 0",
    };
    const flexBetween = {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
    } as const;

    return (
      <div
        ref={ref}
        className="print-content"
        style={{
          margin: "0 auto",
          padding: "4px 8px",
          backgroundColor: "#fff",
          color: "#000",
          fontFamily: "'Courier New', Courier, 'Lucida Console', Monaco, monospace",
          fontSize: "11px",
          lineHeight: "1.35",
          boxSizing: "border-box",
        }}
      >
        <div style={{ textAlign: "center", paddingTop: "4px" }}>
          {setting?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={setting.logoUrl}
              alt="Logo toko"
              style={{
                width: "56px",
                height: "56px",
                objectFit: "contain",
                margin: "0 auto 4px",
              }}
            />
          ) : null}
          <h2
            style={{
              fontSize: "14px",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "-0.5px",
              margin: "0 0 2px 0",
            }}
          >
            {storeName}
          </h2>
          <p style={{ fontSize: "9px", margin: "1px 0" }}>{storeAddress}</p>
          <p style={{ fontSize: "9px", margin: "1px 0" }}>Telp: {storePhone}</p>
        </div>

        <div style={dashedBorder} />

        <div
          style={{
            textAlign: "center",
            fontWeight: 900,
            fontSize: "14px",
            textTransform: "uppercase",
            letterSpacing: "2px",
            padding: "4px 0",
            border: "2px solid #000",
            margin: "4px 0",
          }}
        >
          NOTA PEMBELIAN
        </div>

        <div style={dashedBorder} />

        <div style={{ fontSize: "10px" }}>
          <div style={flexBetween}>
            <span>No: {purchase.orderNumber}</span>
            <span>{formatDate(purchase.createdAt || new Date())}</span>
          </div>
          <div style={flexBetween}>
            <span>Supplier: {purchase.supplier?.name || "-"}</span>
          </div>
          <div style={flexBetween}>
            <span>Dicatat: {purchase.user?.name || "Admin"}</span>
          </div>
        </div>

        <div
          style={{ display: "flex", justifyContent: "center", margin: "8px 0" }}
        >
          <Barcode
            value={purchase.orderNumber || "N/A"} // Fixed: Provide a fallback string for value
            format="CODE128"
            width={1.8}
            height={45}
            fontSize={10}
            lineColor="#000"
            background="#fff"
            textMargin={4}
            renderer="svg"
          />
        </div>

        <div style={dashedBorder} />

        <div>
          {purchase.items?.map((item, idx) => (
            <div
              key={item.id}
              style={{
                marginBottom: idx < (purchase.items?.length || 0) - 1 ? "6px" : "0",
              }}
            >
              <span
                style={{
                  textTransform: "uppercase",
                  fontWeight: 700,
                  display: "block",
                  lineHeight: "1.1",
                  marginBottom: "2px",
                }}
              >
                {item.product?.name || "-"}
              </span>
              <div style={{ ...flexBetween, fontSize: "10px" }}>
                <span>
                  {Number(item.qty).toFixed(0)} x {formatCurrency(Number(item.price))}
                </span>
                <span>{formatCurrency(Number(item.subtotal))}</span>
              </div>
              {item.productVariant?.name && (
                <span
                  style={{
                    fontSize: "9px",
                    fontStyle: "italic",
                    opacity: 0.7,
                  }}
                >
                  Var: {item.productVariant.name}
                </span>
              )}
            </div>
          ))}
        </div>

        <div style={dashedBorder} />

        <div style={{ fontSize: "10px" }}>
          <div
            style={{
              ...flexBetween,
              fontWeight: 900,
              fontSize: "14px",
              paddingTop: "4px",
              borderTop: "1px solid #000",
              marginTop: "4px",
            }}
          >
            <span>TOTAL</span>
            <span>{formatCurrency(Number(purchase.total || 0))}</span>
          </div>
        </div>

        <div style={dashedBorder} />
      </div>
    );
  },
);
