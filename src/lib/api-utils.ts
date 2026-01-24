import { NextResponse } from "next/server";

export function handleApiError(error: any) {
  // Ambil kode error dari driver database (Postgres/MySQL)
  const errorCode = error.code || error.cause?.code;

  // 23505 adalah kode PostgreSQL untuk Unique Violation
  if (errorCode === "23505") {
    const detail = error.detail || error.cause?.detail || "";
    let message = "Data already exists";

    if (detail.includes("sku")) {
      message = "SKU already exists";
    } else if (detail.includes("barcode")) {
      message = "Barcode already exists";
    } else if (detail.includes("name")) {
      message = "Name already exists";
    }

    return NextResponse.json(
      { success: false, error: message },
      { status: 400 },
    );
  }

  // Tangani error validasi Zod jika perlu (opsional)
  if (error.name === "ZodError") {
    return NextResponse.json(
      { success: false, error: "Validation failed", details: error.format() },
      { status: 400 },
    );
  }

  // Log error asli untuk debugging di server (bukan untuk user)
  console.error("[API_ERROR]:", error);

  // Error default untuk masalah internal
  return NextResponse.json(
    {
      success: false,
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal Server Error",
    },
    { status: 500 },
  );
}
