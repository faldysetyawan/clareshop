import { describe, expect, it } from "vitest";

import {
  activePayments,
  contentSchema,
  defaultContent,
  displayPrice,
  formatRupiah,
  mergeContent,
  newPaymentMethod,
  parseRupiah,
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

describe("varian produk", () => {
  it("memberi variants kosong untuk data lama tanpa field variants", () => {
    const merged = mergeContent({
      products: [{ id: "lama", name: "Lama", category: "Game", detail: "d", price: "Rp 10.000", badge: "", mark: "L", image: null }],
    } as never);
    expect(merged.products[0]?.variants).toEqual([]);
  });

  it("mempertahankan varian valid dan membuang yang labelnya kosong", () => {
    const merged = mergeContent({
      products: [
        {
          id: "sp", name: "Spotify", category: "App Premium", detail: "d", price: "Rp 54.990", badge: "", mark: "S", image: null,
          variants: [
            { id: "a", label: "1 bulan", price: "Rp 54.990" },
            { id: "b", label: "   ", price: "Rp 0" },
          ],
        },
      ],
    } as never);
    expect(merged.products[0]?.variants).toHaveLength(1);
    expect(merged.products[0]?.variants[0]?.label).toBe("1 bulan");
  });

  it("displayPrice menampilkan 'Mulai' dari varian termurah", () => {
    const withVariants = mergeContent(null).products.find((p) => p.id === "sp");
    expect(withVariants).toBeDefined();
    expect(displayPrice(withVariants!)).toBe("Mulai Rp 54.990");

    const game = mergeContent(null).products.find((p) => p.id === "ml");
    expect(displayPrice(game!)).toBe("Rp 23.000");
  });

  it("parseRupiah & formatRupiah konsisten", () => {
    expect(parseRupiah("Rp 1.950.000")).toBe(1950000);
    expect(parseRupiah("gratis")).toBeNull();
    expect(formatRupiah(599000)).toBe("Rp 599.000");
  });

  it("skema menerima produk dengan varian", () => {
    const parsed = contentSchema.safeParse(defaultContent);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      const spotify = parsed.data.products.find((p) => p.id === "sp");
      expect(spotify?.variants).toHaveLength(3);
    }
  });
});

describe("varian bawaan untuk data lama", () => {
  it("produk lama ber-id sama dengan bawaan mendapat varian default", () => {
    const merged = mergeContent({
      products: [{ id: "sp", name: "Spotify", category: "App Premium", detail: "d", price: "Rp 54.990", badge: "", mark: "S", image: null }],
    } as never);
    expect(merged.products[0]?.variants).toHaveLength(3);
    expect(merged.products[0]?.variants.map((v) => v.label)).toEqual(["1 bulan", "3 bulan", "12 bulan"]);
  });

  it("varian yang dikosongkan manual tetap kosong", () => {
    const merged = mergeContent({
      products: [{ id: "sp", name: "Spotify", category: "App Premium", detail: "d", price: "Rp 54.990", badge: "", mark: "S", image: null, variants: [] }],
    } as never);
    expect(merged.products[0]?.variants).toEqual([]);
  });
});
