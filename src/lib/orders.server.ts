import type { SupabaseClient } from "@supabase/supabase-js";

import { supabaseAdmin } from "@/integrations/supabase/client.server";

import { checkAdminPassword } from "./content.server";
import { isOrderStatus, type NewOrder, type Order, type OrderStatus } from "./orders";

// Tabel baru belum ada di types.ts bawaan, jadi dipakai tanpa tipe tabel.
const db = () => supabaseAdmin as unknown as SupabaseClient;

function sanitizeOrder(input: unknown): NewOrder | null {
  const data = (input ?? {}) as Record<string, unknown>;
  const text = (value: unknown, max = 200): string =>
    typeof value === "string" ? value.slice(0, max) : "";
  const qty = Number(data["qty"]);
  const total = Number(data["total"]);
  if (!text(data["product_name"], 80)) return null;
  return {
    product_name: text(data["product_name"], 80),
    variant_label: text(data["variant_label"], 40),
    detail: text(data["detail"], 160),
    qty: Number.isFinite(qty) && qty > 0 ? Math.min(Math.floor(qty), 100) : 1,
    total: Number.isFinite(total) && total >= 0 ? Math.floor(total) : 0,
    payment_label: text(data["payment_label"], 40),
    payment_type: text(data["payment_type"], 20),
    target: text(data["target"], 120),
    buyer_name: text(data["buyer_name"], 60),
    note: text(data["note"], 200),
  };
}

/** Dicatat saat pembeli menekan "Saya sudah bayar". Tanpa password (pembeli umum). */
export async function createOrder(input: unknown): Promise<{ ok: boolean }> {
  try {
    const order = sanitizeOrder(input);
    if (!order) return { ok: false };
    const { error } = await db().from("orders").insert({ ...order, status: "pending" });
    if (error) throw new Error(error.message);
    return { ok: true };
  } catch (error) {
    // Kegagalan pencatatan tidak boleh menggagalkan checkout via WhatsApp.
    console.error("[orders] gagal mencatat:", error);
    return { ok: false };
  }
}

type OrdersResult =
  | { status: 200; body: { orders: Order[] } }
  | { status: 401 | 500; body: { error: string } };

/** Daftar order untuk dashboard admin. Perlu password admin. */
export async function listOrders(password: unknown): Promise<OrdersResult> {
  const passwordError = await checkAdminPassword(password);
  if (passwordError) {
    return { status: passwordError === "Password salah." ? 401 : 500, body: { error: passwordError } };
  }
  try {
    const { data, error } = await db()
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    const orders = (data ?? []).map((row) => ({
      id: String(row.id),
      created_at: String(row.created_at),
      product_name: String(row.product_name ?? ""),
      variant_label: String(row.variant_label ?? ""),
      detail: String(row.detail ?? ""),
      qty: Number(row.qty ?? 1),
      total: Number(row.total ?? 0),
      payment_label: String(row.payment_label ?? ""),
      payment_type: String(row.payment_type ?? ""),
      target: String(row.target ?? ""),
      buyer_name: String(row.buyer_name ?? ""),
      note: String(row.note ?? ""),
      status: isOrderStatus(row.status) ? row.status : ("pending" as OrderStatus),
    }));
    return { status: 200, body: { orders } };
  } catch (error) {
    console.error("[orders] gagal membaca:", error);
    return { status: 500, body: { error: "Gagal membaca data order." } };
  }
}

type StatusResult =
  | { status: 200; body: { ok: true } }
  | { status: 400 | 401 | 500; body: { error: string } };

/** Ubah status order (pending/paid/done/cancelled). Perlu password admin. */
export async function setOrderStatus(
  password: unknown,
  id: unknown,
  status: unknown,
): Promise<StatusResult> {
  const passwordError = await checkAdminPassword(password);
  if (passwordError) {
    return { status: passwordError === "Password salah." ? 401 : 500, body: { error: passwordError } };
  }
  if (typeof id !== "string" || !id || !isOrderStatus(status)) {
    return { status: 400, body: { error: "Data tidak valid." } };
  }
  try {
    const { error } = await db().from("orders").update({ status }).eq("id", id);
    if (error) throw new Error(error.message);
    return { status: 200, body: { ok: true } };
  } catch (error) {
    console.error("[orders] gagal mengubah status:", error);
    return { status: 500, body: { error: "Gagal mengubah status order." } };
  }
}
