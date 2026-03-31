import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sales } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { simulatePakasirPayment, verifyPakasirTransaction } from "@/lib/pakasir";

/**
 * POST /api/pakasir-simulate
 *
 * KHUSUS DEVELOPMENT — diblokir otomatis di production.
 *
 * Flow yang benar (tanpa perlu webhook / ngrok):
 * 1. Call Pakasir paymentsimulation API  → Pakasir catat transaksi sebagai paid
 * 2. Poll Pakasir transactiondetail API  → tunggu sampai status = "completed"
 * 3. Update DB sendiri                   → tidak butuh webhook masuk sama sekali
 *
 * Ini sesuai dengan docs Pakasir section E:
 * "Kami sarankan untuk tetap menggunakan API dibawah ini untuk pengecekan
 *  status yang lebih valid." (Transaction Detail API)
 *
 * Body: { saleId: number }
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { success: false, error: "Tidak tersedia di production" },
      { status: 403 },
    );
  }

  let saleId: number;

  try {
    const body = await request.json();
    saleId = Number(body.saleId);
  } catch {
    return NextResponse.json(
      { success: false, error: "Body tidak valid, kirim JSON dengan field saleId" },
      { status: 400 },
    );
  }

  if (!saleId || isNaN(saleId)) {
    return NextResponse.json(
      { success: false, error: "saleId tidak valid" },
      { status: 400 },
    );
  }

  // Ambil data sale
  const sale = await db.query.sales.findFirst({
    where: eq(sales.id, saleId),
  });

  if (!sale) {
    return NextResponse.json(
      { success: false, error: `Sale ID ${saleId} tidak ditemukan` },
      { status: 404 },
    );
  }

  if (sale.status === "completed") {
    return NextResponse.json({
      success: true,
      message: "Sale sudah berstatus completed",
    });
  }

  if (sale.status !== "pending_payment") {
    return NextResponse.json(
      {
        success: false,
        error: `Sale berstatus "${sale.status}", hanya "pending_payment" yang bisa disimulasikan`,
      },
      { status: 400 },
    );
  }

  if (!sale.qrisOrderId) {
    return NextResponse.json(
      { success: false, error: "Sale ini bukan transaksi QRIS (qrisOrderId kosong)" },
      { status: 400 },
    );
  }

  const netAmount = Number(sale.totalPrice) - Number(sale.totalBalanceUsed ?? 0);

  // ── STEP 1: Kirim simulasi ke Pakasir ────────────────────────────────────
  try {
    await simulatePakasirPayment(sale.qrisOrderId, netAmount);
  } catch (simulateError) {
    const msg = simulateError instanceof Error ? simulateError.message : "Unknown";
    console.error("[pakasir-simulate] Pakasir simulate API error:", msg);
    return NextResponse.json(
      {
        success: false,
        error: `Gagal kirim simulasi ke Pakasir: ${msg}. `
          + `Pastikan proyek kamu dalam mode Sandbox di dashboard Pakasir.`,
      },
      { status: 502 },
    );
  }

  // ── STEP 2: Poll Pakasir transaction detail sampai status completed ───────
  // Pakasir biasanya update status dalam <1 detik setelah simulate
  // Kita coba max 10x dengan jeda 500ms = total max 5 detik
  const MAX_ATTEMPTS = 10;
  const POLL_DELAY_MS = 500;

  let pakasirCompleted = false;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    // Jeda sebelum cek (beri waktu Pakasir proses)
    await new Promise((resolve) => setTimeout(resolve, POLL_DELAY_MS));

    try {
      const detail = await verifyPakasirTransaction(sale.qrisOrderId, netAmount);

      if (detail.transaction?.status === "completed") {
        pakasirCompleted = true;
        break;
      }

      console.log(
        `[pakasir-simulate] Attempt ${attempt}/${MAX_ATTEMPTS}: status = ${detail.transaction?.status}`,
      );
    } catch (pollError) {
      console.warn(`[pakasir-simulate] Poll attempt ${attempt} error:`, pollError);
      // Lanjut coba lagi
    }
  }

  if (!pakasirCompleted) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Simulasi terkirim ke Pakasir tapi status belum berubah jadi completed setelah 5 detik. "
          + "Coba lagi atau cek dashboard Pakasir.",
      },
      { status: 504 },
    );
  }

  // ── STEP 3: Update DB langsung — tidak butuh webhook ─────────────────────
  await db
    .update(sales)
    .set({
      status: "completed",
      totalPaid: netAmount.toFixed(2),
      totalReturn: "0",
    })
    .where(eq(sales.id, saleId));

  console.log(
    `[pakasir-simulate] Sale ${sale.invoiceNumber} berhasil di-set completed via polling`,
  );

  return NextResponse.json({
    success: true,
    message: `[DEV] Sale ${sale.invoiceNumber} berhasil dikonfirmasi via Pakasir API`,
  });
}
