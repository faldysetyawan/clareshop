import type { SupabaseClient } from "@supabase/supabase-js";

import { supabaseAdmin } from "@/integrations/supabase/client.server";

import { contentSchema, type SiteContent } from "./site-content";

const ROW_ID = "main";
const BUCKET = "site-images";
const MAX_IMAGE_BYTES = 1_500_000;

// Tabel baru belum ada di types.ts bawaan, jadi dipakai tanpa tipe tabel.
const db = () => supabaseAdmin as unknown as SupabaseClient;

export async function loadContent(): Promise<SiteContent | null> {
  try {
    const { data, error } = await db().from("site_content").select("content").eq("id", ROW_ID).maybeSingle();
    if (error) {
      console.error("[content] gagal membaca:", error.message);
      return null;
    }
    if (!data) return null;
    const parsed = contentSchema.safeParse(data.content);
    return parsed.success ? parsed.data : null;
  } catch (error) {
    // Mis. variabel SUPABASE_* belum diisi: situs tetap tampil dengan isi bawaan.
    console.error("[content] backend tidak tersedia:", error);
    return null;
  }
}

function safeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

async function uploadImage(dataUrl: string, prefix: string): Promise<string> {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(dataUrl);
  const contentType = match?.[1];
  const base64 = match?.[2];
  if (!contentType || !base64) throw new Error("Format gambar tidak didukung.");
  const binary = atob(base64);
  if (binary.length > MAX_IMAGE_BYTES) throw new Error("Gambar terlalu besar (maks. 1,5 MB).");
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const extension = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  const safePrefix = prefix.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 40) || "img";
  const path = `${safePrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${extension}`;

  const { error } = await db().storage.from(BUCKET).upload(path, bytes, {
    contentType,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error(`Gagal mengunggah gambar: ${error.message}`);
  return db().storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

type SaveResult = { status: number; body: { error: string } | { content: SiteContent } };

export async function saveContent(payload: unknown): Promise<SaveResult> {
  const adminPassword = process.env["ADMIN_PASSWORD"];
  if (!adminPassword) {
    return { status: 500, body: { error: "ADMIN_PASSWORD belum diatur di server." } };
  }

  const { password, content } = (payload ?? {}) as { password?: unknown; content?: unknown };
  if (typeof password !== "string" || !safeEqual(password, adminPassword)) {
    await new Promise((resolve) => setTimeout(resolve, 600)); // memperlambat tebak-tebakan password
    return { status: 401, body: { error: "Password salah." } };
  }

  const parsed = contentSchema.safeParse(content);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { status: 400, body: { error: `Isi tidak valid (${issue?.path.join(".") ?? "?"}): ${issue?.message ?? ""}` } };
  }

  try {
    const next = parsed.data;
    // Gambar baru (data URL) diunggah ke Storage lalu diganti alamat URL-nya.
    const resolve = async (value: string | null, prefix: string) =>
      value?.startsWith("data:") ? uploadImage(value, prefix) : value;
    next.promo.image = await resolve(next.promo.image, "promo");
    next.logo = await resolve(next.logo, "logo");
    for (const product of next.products) {
      product.image = await resolve(product.image, `produk-${product.id}`);
    }
    for (const payment of next.payments) {
      payment.image = await resolve(payment.image, `bayar-${payment.id}`);
    }
    const { error } = await db()
      .from("site_content")
      .upsert({ id: ROW_ID, content: next, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { status: 200, body: { content: next } };
  } catch (error) {
    console.error("[content] gagal menyimpan:", error);
    return { status: 500, body: { error: error instanceof Error ? error.message : "Gagal menyimpan." } };
  }
}
