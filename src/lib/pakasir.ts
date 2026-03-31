const PAKASIR_BASE = "https://app.pakasir.com/api";

function getConfig() {
  const project = process.env.PAKASIR_PROJECT;
  const apiKey = process.env.PAKASIR_API_KEY;
  if (!project || !apiKey) {
    throw new Error("PAKASIR_PROJECT dan PAKASIR_API_KEY harus diset di environment variables");
  }
  return { project, apiKey };
}

export interface PakasirQrisResponse {
  payment: {
    project: string;
    order_id: string;
    amount: number;
    fee: number;
    total_payment: number;
    payment_method: "qris";
    payment_number: string;
    expired_at: string;
  };
}

export interface PakasirWebhookPayload {
  amount: number;
  order_id: string;
  project: string;
  status: "completed";
  payment_method: string;
  completed_at: string;
}

export interface PakasirTransactionDetail {
  transaction: {
    amount: number;
    order_id: string;
    project: string;
    status: "completed" | "pending" | "failed";
    payment_method: string;
    completed_at?: string;
  };
}

export async function createPakasirQris(
  orderId: string,
  amount: number,
): Promise<PakasirQrisResponse> {
  const { project, apiKey } = getConfig();

  const res = await fetch(`${PAKASIR_BASE}/transactioncreate/qris`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      project,
      order_id: orderId,
      amount: Math.round(amount),
      api_key: apiKey,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Pakasir gagal membuat QRIS: ${errText}`);
  }

  return res.json();
}

export async function cancelPakasirTransaction(
  orderId: string,
  amount: number,
): Promise<void> {
  const { project, apiKey } = getConfig();

  await fetch(`${PAKASIR_BASE}/transactioncancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      project,
      order_id: orderId,
      amount: Math.round(amount),
      api_key: apiKey,
    }),
  });
}

/**
 * Simulasi pembayaran — HANYA untuk proyek mode Sandbox di dashboard Pakasir.
 * Gunakan ini saat development/testing untuk mensimulasikan customer sudah bayar
 * tanpa perlu scan QR sungguhan.
 *
 * Setelah dipanggil, Pakasir akan mengirim webhook ke endpoint kamu
 * seolah-olah pembayaran benar-benar terjadi.
 *
 * JANGAN dipanggil di production (proyek Live).
 */
export async function simulatePakasirPayment(
  orderId: string,
  amount: number,
): Promise<void> {
  const { project, apiKey } = getConfig();

  const res = await fetch(`${PAKASIR_BASE}/paymentsimulation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      project,
      order_id: orderId,
      amount: Math.round(amount),
      api_key: apiKey,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Pakasir simulasi gagal: ${errText}`);
  }
}

export async function verifyPakasirTransaction(
  orderId: string,
  amount: number,
): Promise<PakasirTransactionDetail> {
  const { project, apiKey } = getConfig();

  const params = new URLSearchParams({
    project,
    order_id: orderId,
    amount: String(Math.round(amount)),
    api_key: apiKey,
  });

  const res = await fetch(`${PAKASIR_BASE}/transactiondetail?${params}`);

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Pakasir verifikasi gagal: ${errText}`);
  }

  return res.json();
}
