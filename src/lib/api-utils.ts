import { NextResponse } from "next/server";

export function handleApiError(error: string | unknown) {
  const errorCode =
    (error as { code: string }).code ||
    (error as { cause: { code: string } }).cause?.code;

  if (errorCode === "23505") {
    const detail =
      (error as { detail: string }).detail ||
      (error as { cause: { detail: string } }).cause?.detail ||
      "";
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

  if ((error as { name: string }).name === "ZodError") {
    return NextResponse.json(
      {
        success: false,
        error: "Validation failed",
        details: (error as { format: () => unknown }).format(),
      },
      { status: 400 },
    );
  }
  console.error("[API_ERROR]:", error);

  return NextResponse.json(
    {
      success: false,
      error:
        process.env.NODE_ENV === "development"
          ? typeof error === "string"
            ? error
            : error instanceof Error
              ? error.message
              : "Unknown error"
          : "Terjadi kesalahan pada server",
    },
    { status: 500 },
  );
}
