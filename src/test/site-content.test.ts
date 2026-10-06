import { describe, expect, it } from "vitest";

import {
  activePayments,
  contentSchema,
  defaultContent,
  mergeContent,
  newPaymentMethod,
} from "@/lib/site-content";

describe("mergeContent", () => {
  it("memakai pembayaran bawaan bila data lama tidak punya field payments", () => {
    const merged = mergeContent({ brand: "Toko Lama" } as never);
    expect(merged.brand).toBe("Toko Lama");
    expect(merged.payments).toHaveLength(defaultContent.payments.length);
    expect(merged.payments.map((p) => p.type)).toContain("qris");
  });

  it("membersihkan tipe & status aktif pembayaran yang rusak", () => {
    const merged = mergeContent({
      payments: [
        { id: "x", type: "aneh", label: "X", accountName: "", accountNumber: "", note: "", image: null },
        { id: "y", type: "bank", label: "Y", accountName: "", accountNumber: "", note: "", active: false, image: null },
      ],
    } as never);
    expect(merged.payments[0]?.type).toBe("bank");
    expect(merged.payments[0]?.active).toBe(true);
    expect(merged.payments[1]?.active).toBe(false);
  });
});

describe("activePayments", () => {
  it("hanya mengembalikan metode aktif berlabel", () => {
    const list = activePayments([
      newPaymentMethod("bank"),
      { ...newPaymentMethod("qris"), active: false },
      { ...newPaymentMethod("ewallet"), label: "   " },
    ]);
    expect(list).toHaveLength(1);
    expect(list[0]?.type).toBe("bank");
  });
});

describe("contentSchema", () => {
  it("menerima konten bawaan termasuk pembayaran", () => {
    const parsed = contentSchema.safeParse(defaultContent);
    expect(parsed.success).toBe(true);
  });

  it("menolak tipe pembayaran yang tidak dikenal", () => {
    const parsed = contentSchema.safeParse({
      ...defaultContent,
      payments: [{ ...newPaymentMethod("bank"), type: "kartu" }],
    });
    expect(parsed.success).toBe(false);
  });
});
