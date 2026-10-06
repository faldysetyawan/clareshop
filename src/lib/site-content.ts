import { useCallback, useState } from "react";
import { z } from "zod";

export type ProductCategory = "Game" | "App Premium";

export type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  detail: string;
  price: string;
  badge: string;
  mark: string;
  /** null = tanpa gambar; selain itu data URL (draf) atau alamat https (tersimpan) */
  image: string | null;
};

export type PaymentType = "bank" | "ewallet" | "qris";

export const paymentTypeLabels: Record<PaymentType, string> = {
  bank: "Transfer Bank",
  ewallet: "E-Wallet",
  qris: "QRIS",
};

export type PaymentMethod = {
  id: string;
  type: PaymentType;
  /** Nama tampilan, mis. "BCA", "DANA", "QRIS" */
  label: string;
  /** Nama pemilik rekening / akun */
  accountName: string;
  /** Nomor rekening / nomor e-wallet (kosong untuk QRIS) */
  accountNumber: string;
  /** Catatan/instruksi tambahan untuk pembeli */
  note: string;
  /** false = disembunyikan dari pembeli */
  active: boolean;
  /** Gambar kode QR (khusus QRIS): data URL (draf) atau alamat https (tersimpan) */
  image: string | null;
};

export type SiteContent = {
  brand: string;
  logo: string | null;
  /** Nomor WhatsApp admin untuk menerima pesanan, hanya angka (mis. 6281234567890) */
  whatsapp: string;
  safeLabel: string;
  promo: {
    badge: string;
    title: string;
    subtitle: string;
    button: string;
    /** null = pakai gambar bawaan, selain itu data URL hasil upload */
    image: string | null;
    imageAlt: string;
  };
  searchPlaceholder: string;
  marquee: string[];
  productsEyebrow: string;
  productsTitle: string;
  trustNote: string;
  footerLeft: string;
  footerRight: string;
  products: Product[];
  /** Metode pembayaran manual (transfer bank, e-wallet, QRIS). */
  payments: PaymentMethod[];
  paymentTitle: string;
  paymentNote: string;
};

export const defaultContent: SiteContent = {
  brand: "Sakura Pop",
  logo: null,
  whatsapp: "",
  safeLabel: "Aman",
  promo: {
    badge: "Promo bulan ini",
    title: "Voucher digital, tinggal pilih.",
    subtitle: "Top-up game dan langganan favorit, praktis setiap hari.",
    button: "Belanja sekarang",
    image: null,
    imageAlt: "Kotak pastel berisi voucher digital",
  },
  searchPlaceholder: "Cari game atau langganan…",
  marquee: ["Proses instan", "Harga transparan", "Pembayaran aman", "Bantuan setiap hari"],
  productsEyebrow: "Pilihan hari ini",
  productsTitle: "Produk populer",
  trustNote: "Transaksi terenkripsi & instan",
  footerLeft: "Sakura Pop",
  footerRight: "© 2026 · Toko digital Indonesia",
  paymentTitle: "Metode pembayaran",
  paymentNote: "Transfer sesuai total, lalu konfirmasi via WhatsApp.",
  payments: [
    { id: "pay-bca", type: "bank", label: "BCA", accountName: "Sakura Pop", accountNumber: "1234567890", note: "", active: true, image: null },
    { id: "pay-bri", type: "bank", label: "BRI", accountName: "Sakura Pop", accountNumber: "1234567890", note: "", active: true, image: null },
    { id: "pay-mandiri", type: "bank", label: "Mandiri", accountName: "Sakura Pop", accountNumber: "1234567890", note: "", active: true, image: null },
    { id: "pay-dana", type: "ewallet", label: "DANA", accountName: "Sakura Pop", accountNumber: "081234567890", note: "", active: true, image: null },
    { id: "pay-gopay", type: "ewallet", label: "GoPay", accountName: "Sakura Pop", accountNumber: "081234567890", note: "", active: true, image: null },
    { id: "pay-ovo", type: "ewallet", label: "OVO", accountName: "Sakura Pop", accountNumber: "081234567890", note: "", active: true, image: null },
    { id: "pay-qris", type: "qris", label: "QRIS", accountName: "Sakura Pop", accountNumber: "", note: "Scan kode QR di bawah dari aplikasi apa pun.", active: true, image: null },
  ],
  products: [
    { id: "ml", name: "Mobile Legends", category: "Game", detail: "100 + bonus 15 diamonds", price: "Rp 23.000", badge: "-10%", mark: "ML", image: null },
    { id: "ff", name: "Free Fire", category: "Game", detail: "50 + 5 diamonds", price: "Rp 10.000", badge: "", mark: "FF", image: null },
    { id: "val", name: "Valorant", category: "Game", detail: "875 VP", price: "Rp 150.000", badge: "", mark: "V", image: null },
    { id: "nf", name: "Netflix", category: "App Premium", detail: "Premium 1 bulan", price: "Rp 186.000", badge: "", mark: "N", image: null },
    { id: "sp", name: "Spotify", category: "App Premium", detail: "Premium 1 bulan", price: "Rp 54.990", badge: "", mark: "S", image: null },
    { id: "cv", name: "Canva Pro", category: "App Premium", detail: "Akses penuh 12 bulan", price: "Rp 599.000", badge: "", mark: "C", image: null },
  ],
};

export function newPaymentMethod(type: PaymentType = "bank"): PaymentMethod {
  return {
    id: `pay-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    type,
    label: type === "qris" ? "QRIS" : "Metode baru",
    accountName: "",
    accountNumber: "",
    note: "",
    active: true,
    image: null,
  };
}

/** Metode pembayaran yang tampil untuk pembeli (aktif saja). */
export function activePayments(payments: PaymentMethod[]): PaymentMethod[] {
  return payments.filter((payment) => payment.active && payment.label.trim());
}

export function newProduct(name = "Produk baru", category: ProductCategory = "Game"): Product {
  return {
    id: `p-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    name,
    category,
    detail: "Deskripsi produk",
    price: "Rp 0",
    badge: "",
    mark: name.trim().charAt(0).toUpperCase() || "P",
    image: null,
  };
}

const text = (max = 300) => z.string().max(max);

/** Gambar: data URL (baru diunggah) atau alamat https (sudah tersimpan). */
const imageField = z
  .string()
  .max(2_000_000)
  .regex(/^(data:image\/(jpeg|png|webp);base64,|https:\/\/)/);

/** Dipakai server untuk memvalidasi isi sebelum disimpan ke database. */
export const contentSchema = z.object({
  brand: text(60),
  logo: imageField.nullable().default(null),
  whatsapp: z
    .string()
    .regex(/^(\d{8,15})?$/)
    .default(""),
  safeLabel: text(40),
  promo: z.object({
    badge: text(60),
    title: text(160),
    subtitle: text(300),
    button: text(60),
    image: imageField.nullable(),
    imageAlt: text(200),
  }),
  searchPlaceholder: text(100),
  marquee: z.array(text(60)).min(1).max(12),
  productsEyebrow: text(60),
  productsTitle: text(100),
  trustNote: text(120),
  footerLeft: text(80),
  footerRight: text(120),
  products: z
    .array(
      z.object({
        id: text(40),
        name: text(80),
        category: z.enum(["Game", "App Premium"]),
        detail: text(160),
        price: text(40),
        badge: text(20),
        mark: text(3),
        image: imageField.nullable().default(null),
      }),
    )
    .max(100),
  payments: z
    .array(
      z.object({
        id: text(40),
        type: z.enum(["bank", "ewallet", "qris"]),
        label: text(40),
        accountName: text(80),
        accountNumber: text(40),
        note: text(200),
        active: z.boolean().default(true),
        image: imageField.nullable().default(null),
      }),
    )
    .max(30)
    .default([]),
  paymentTitle: text(80).default("Metode pembayaran"),
  paymentNote: text(200).default(""),
});

/** Gabungkan data dari database dengan bawaan supaya field yang hilang tidak bikin error. */
export function mergeContent(stored: Partial<SiteContent> | null | undefined): SiteContent {
  const data = stored ?? {};
  return {
    ...defaultContent,
    ...data,
    promo: { ...defaultContent.promo, ...(data.promo ?? {}) },
    marquee: Array.isArray(data.marquee) && data.marquee.length > 0 ? data.marquee : defaultContent.marquee,
    products: Array.isArray(data.products)
      ? data.products.map((product) => ({ ...product, image: product.image ?? null }))
      : defaultContent.products,
    payments: Array.isArray(data.payments) && data.payments.length > 0
      ? data.payments.map((payment) => ({
          ...payment,
          type: payment.type === "ewallet" || payment.type === "qris" ? payment.type : "bank",
          active: payment.active !== false,
          image: payment.image ?? null,
        }))
      : defaultContent.payments,
  };
}

export type SaveStatus =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "error"; message: string };

/**
 * `initial` = isi yang tersimpan di database (null jika belum ada / backend belum terhubung).
 * Perubahan menjadi draf di browser; baru tampil ke pengunjung setelah `save()` berhasil.
 *
 * Sebagai penggabungan dari versi backend: konten terakhir dari server juga disimpan
 * sebagai cache di localStorage, supaya toko tetap tampil dengan isi terbaru walau
 * server sedang tidak terjangkau (lalu `initial` null).
 */
const CONTENT_CACHE_KEY = "sakura-pop:content:v1";

function readContentCache(): SiteContent | null {
  try {
    const raw = window.localStorage.getItem(CONTENT_CACHE_KEY);
    if (!raw) return null;
    return mergeContent(JSON.parse(raw) as Partial<SiteContent>);
  } catch {
    return null;
  }
}

function writeContentCache(content: SiteContent) {
  try {
    // Gambar data URL yang belum tersimpan bisa besar; cache hanya menyimpan teks.
    // (Versi yang sudah tersimpan di server memakai URL https yang ringan.)
    window.localStorage.setItem(CONTENT_CACHE_KEY, JSON.stringify(content));
  } catch {
    /* Penyimpanan penuh / mode privat: abaikan, situs tetap jalan. */
  }
}

export function useSiteContent(initial: SiteContent | null) {
  const [saved, setSaved] = useState<SiteContent>(() => {
    if (initial) {
      writeContentCache(initial);
      return mergeContent(initial);
    }
    return readContentCache() ?? mergeContent(null);
  });
  const [content, setContent] = useState<SiteContent>(saved);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<SaveStatus>({ kind: "idle" });

  const update = useCallback((updater: (current: SiteContent) => SiteContent) => {
    setDirty(true);
    setStatus({ kind: "idle" });
    setContent(updater);
  }, []);

  const discard = useCallback(() => {
    setContent(saved);
    setDirty(false);
    setStatus({ kind: "idle" });
  }, [saved]);

  const save = useCallback(
    async (password: string) => {
      setStatus({ kind: "saving" });
      try {
        const response = await fetch("/api/content", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ password, content }),
        });
        const data = (await response.json().catch(() => ({}))) as { error?: string; content?: SiteContent };
        if (!response.ok || !data.content) throw new Error(data.error ?? "Gagal menyimpan.");
        const next = mergeContent(data.content);
        setSaved(next);
        setContent(next); // gambar upload kini berupa alamat URL, bukan data mentah
        writeContentCache(next);
        setDirty(false);
        setStatus({ kind: "saved" });
        return true;
      } catch (error) {
        setStatus({ kind: "error", message: error instanceof Error ? error.message : "Gagal menyimpan." });
        return false;
      }
    },
    [content],
  );

  return { content, update, discard, save, dirty, status };
}
