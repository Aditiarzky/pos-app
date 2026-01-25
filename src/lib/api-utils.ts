import { NextResponse } from "next/server";

export function handleApiError(error: any) {
  const errorCode = error.code || error.cause?.code;

  if (errorCode === "23505") {
    const detail = error.detail || error.cause?.detail || "";
    let message = "Ada data yang sama";

    if (detail.includes("sku")) {
      message = "Ada data dengan SKU yang sama";
    } else if (detail.includes("barcode")) {
      message = "Ada data dengan Barcode yang sama";
    } else if (detail.includes("name")) {
      message = "Ada data dengan Nama yang sama";
    }

    return NextResponse.json(
      { success: false, error: message },
      { status: 400 },
    );
  }

  if (error.name === "ZodError") {
    return NextResponse.json(
      { success: false, error: "Validation failed", details: error.format() },
      { status: 400 },
    );
  }
  console.error("[API_ERROR]:", error);

  return NextResponse.json(
    {
      success: false,
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Terjadi kesalahan pada server",
    },
    { status: 500 },
  );
}
