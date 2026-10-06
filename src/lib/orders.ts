/** Tipe & helper untuk pencatatan order. File ini aman dipakai di client. */

export type OrderStatus = "pending" | "paid" | "done" | "cancelled";

export const ORDER_STATUSES: OrderStatus[] = ["pending", "paid", "done", "cancelled"];

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: "Menunggu",
  paid: "Lunas",
  done: "Selesai",
  cancelled: "Batal",
};

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as string[]).includes(value);
}

export type Order = {
  id: string;
  created_at: string;
  product_name: string;
  variant_label: string;
  detail: string;
  qty: number;
  /** Total dalam rupiah (angka saja). */
  total: number;
  payment_label: string;
  payment_type: string;
  /** ID game / email / nomor akun tujuan */
  target: string;
  buyer_name: string;
  note: string;
  status: OrderStatus;
};

export type NewOrder = Pick<
  Order,
  | "product_name"
  | "variant_label"
  | "detail"
  | "qty"
  | "total"
  | "payment_label"
  | "payment_type"
  | "target"
  | "buyer_name"
  | "note"
>;

/** Status yang dihitung sebagai penghasilan. */
export function isRevenueStatus(status: OrderStatus): boolean {
  return status === "paid" || status === "done";
}

export type OrderSummary = {
  /** Jumlah penghasilan (Rp) dari order lunas/selesai. */
  revenue: number;
  /** Jumlah order lunas/selesai. */
  paidCount: number;
  /** Jumlah order menunggu verifikasi. */
  pendingCount: number;
  /** Jumlah seluruh order. */
  totalCount: number;
  /** Penghasilan hari ini (zona waktu lokal browser/server). */
  todayRevenue: number;
};

function startOfToday(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

export function summarizeOrders(orders: Order[]): OrderSummary {
  const today = startOfToday();
  let revenue = 0;
  let paidCount = 0;
  let pendingCount = 0;
  let todayRevenue = 0;
  for (const order of orders) {
    if (order.status === "pending") pendingCount += 1;
    if (isRevenueStatus(order.status)) {
      paidCount += 1;
      revenue += order.total;
      if (new Date(order.created_at) >= today) todayRevenue += order.total;
    }
  }
  return { revenue, paidCount, pendingCount, totalCount: orders.length, todayRevenue };
}

export type DailyRevenue = { date: string; label: string; total: number };

/** Kelompokkan penghasilan per hari untuk N hari terakhir (termasuk hari ini). */
export function revenueByDay(orders: Order[], days = 7): DailyRevenue[] {
  const buckets = new Map<string, number>();
  const labels = new Map<string, string>();
  const today = startOfToday();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    buckets.set(key, 0);
    labels.set(
      key,
      date.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
    );
  }
  for (const order of orders) {
    if (!isRevenueStatus(order.status)) continue;
    const date = new Date(order.created_at);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + order.total);
  }
  return [...buckets.entries()].map(([key, total]) => ({
    date: key,
    label: labels.get(key) ?? key,
    total,
  }));
}
