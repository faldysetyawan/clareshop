import { describe, expect, it } from "vitest";

import {
  isOrderStatus,
  isRevenueStatus,
  orderStatusLabels,
  revenueByDay,
  summarizeOrders,
  type Order,
} from "@/lib/orders";

const order = (overrides: Partial<Order> = {}): Order => ({
  id: "1",
  created_at: new Date().toISOString(),
  product_name: "Spotify",
  variant_label: "3 bulan",
  detail: "Premium",
  qty: 1,
  total: 155000,
  payment_label: "BCA",
  payment_type: "bank",
  target: "user@mail.com",
  buyer_name: "Budi",
  note: "",
  status: "pending",
  ...overrides,
});

describe("isOrderStatus", () => {
  it("mengenali status yang valid", () => {
    expect(isOrderStatus("pending")).toBe(true);
    expect(isOrderStatus("paid")).toBe(true);
    expect(isOrderStatus("done")).toBe(true);
    expect(isOrderStatus("cancelled")).toBe(true);
    expect(isOrderStatus("lunas")).toBe(false);
    expect(isOrderStatus(null)).toBe(false);
  });

  it("label tersedia untuk semua status", () => {
    expect(orderStatusLabels.pending).toBe("Menunggu");
    expect(orderStatusLabels.paid).toBe("Lunas");
    expect(orderStatusLabels.done).toBe("Selesai");
    expect(orderStatusLabels.cancelled).toBe("Batal");
  });
});

describe("isRevenueStatus", () => {
  it("hanya paid & done yang dihitung penghasilan", () => {
    expect(isRevenueStatus("paid")).toBe(true);
    expect(isRevenueStatus("done")).toBe(true);
    expect(isRevenueStatus("pending")).toBe(false);
    expect(isRevenueStatus("cancelled")).toBe(false);
  });
});

describe("summarizeOrders", () => {
  it("menghitung ringkasan dengan benar", () => {
    const orders = [
      order({ id: "1", status: "paid", total: 100000 }),
      order({ id: "2", status: "done", total: 50000 }),
      order({ id: "3", status: "pending", total: 200000 }),
      order({ id: "4", status: "cancelled", total: 300000 }),
    ];
    const summary = summarizeOrders(orders);
    expect(summary.revenue).toBe(150000);
    expect(summary.paidCount).toBe(2);
    expect(summary.pendingCount).toBe(1);
    expect(summary.totalCount).toBe(4);
    expect(summary.todayRevenue).toBe(150000);
  });

  it("order kemarin tidak masuk penghasilan hari ini", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const orders = [order({ status: "paid", total: 999000, created_at: yesterday.toISOString() })];
    const summary = summarizeOrders(orders);
    expect(summary.revenue).toBe(999000);
    expect(summary.todayRevenue).toBe(0);
  });
});

describe("revenueByDay", () => {
  it("mengelompokkan per hari dan mengabaikan yang belum lunas", () => {
    const orders = [
      order({ status: "paid", total: 100000 }),
      order({ status: "pending", total: 5000000 }),
    ];
    const days = revenueByDay(orders, 3);
    expect(days).toHaveLength(3);
    expect(days[2]?.total).toBe(100000);
    expect(days[0]?.total).toBe(0);
  });
});
