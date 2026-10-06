import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Eye,
  Gamepad2,
  ImageIcon,
  Pencil,
  Plus,
  Save,
  Undo2,
  Search,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Trash2,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import promoImage from "@/assets/sakura-voucher-bento.jpg";
import { CheckoutDialog } from "@/components/checkout-dialog";
import { EditableImage, EditableText, ImagePicker } from "@/components/editable";
import { PaymentEditor } from "@/components/payment-editor";
import { Button, buttonVariants } from "@/components/ui/button";
import { getSiteContent } from "@/lib/content.functions";
import { activePayments, newProduct, useSiteContent, type Product, type ProductCategory } from "@/lib/site-content";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  loader: () => getSiteContent(),
  head: () => ({
    meta: [
      { title: "Sakura Pop — Top-up Game & App Premium" },
      { name: "description", content: "Beli diamond game dan langganan aplikasi premium dengan harga jujur, proses cepat, dan transaksi aman." },
      { property: "og:title", content: "Sakura Pop — Top-up Game & App Premium" },
      { property: "og:description", content: "Beli diamond game dan langganan aplikasi premium dengan harga jujur, proses cepat, dan transaksi aman." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Category = "Semua" | "Game" | "App Premium";

function Index() {
  const initialContent = Route.useLoaderData();
  const { content, update, discard, save, dirty, status } = useSiteContent(initialContent);
  const [password, setPassword] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("Semua");
  const [subTab, setSubTab] = useState("");
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [editing, setEditing] = useState(false);
  const productsRef = useRef<HTMLElement>(null);

  // Mode edit hanya muncul jika alamat halaman diakhiri ?edit (pengunjung biasa tidak melihatnya).
  useEffect(() => {
    const allowed = new URLSearchParams(window.location.search).has("edit");
    setCanEdit(allowed);
    setEditing(allowed);
    try {
      setPassword(window.sessionStorage.getItem("sakura-pop:admin") ?? "");
    } catch {
      /* sessionStorage diblokir: password diketik ulang */
    }
  }, []);

  const changePassword = (value: string) => {
    setPassword(value);
    try {
      window.sessionStorage.setItem("sakura-pop:admin", value);
    } catch {
      /* abaikan */
    }
  };

  const { products, promo } = content;

  // Tab per game/aplikasi: diambil otomatis dari nama produk di kategori yang dipilih.
  const subTabs = useMemo(
    () =>
      category === "Semua"
        ? []
        : Array.from(new Set(products.filter((product) => product.category === category).map((product) => product.name))),
    [category, products],
  );
  const activeSubTab = subTabs.includes(subTab) ? subTab : "";

  const visibleProducts = useMemo(() => {
    // Saat mengedit, tampilkan semua produk agar yang sedang diubah tidak hilang karena filter.
    if (editing) return products;
    const normalized = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = category === "Semua" || product.category === category;
      const matchesSubTab = !activeSubTab || product.name === activeSubTab;
      const matchesQuery = !normalized || `${product.name} ${product.detail}`.toLowerCase().includes(normalized);
      return matchesCategory && matchesSubTab && matchesQuery;
    });
  }, [category, activeSubTab, query, products, editing]);

  const pickCategory = (next: Category) => {
    setCategory(next);
    setSubTab("");
    productsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const setField = <K extends keyof typeof content>(key: K, value: (typeof content)[K]) =>
    update((current) => ({ ...current, [key]: value }));

  const setPromo = (patch: Partial<typeof promo>) =>
    update((current) => ({ ...current, promo: { ...current.promo, ...patch } }));

  const setProduct = (id: string, patch: Partial<Product>) =>
    update((current) => ({
      ...current,
      products: current.products.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));

  const setPayments = (payments: typeof content.payments) =>
    update((current) => ({ ...current, payments }));

  const removeProduct = (product: Product) => {
    if (!window.confirm(`Hapus produk "${product.name}"?`)) return;
    update((current) => ({ ...current, products: current.products.filter((item) => item.id !== product.id) }));
  };

  const setMarquee = (index: number, value: string) =>
    update((current) => ({
      ...current,
      marquee: current.marquee.map((item, position) => (position === index ? value : item)),
    }));

  const handleDiscard = () => {
    if (window.confirm("Buang semua perubahan yang belum disimpan?")) discard();
  };

  const marqueeItems = editing ? content.marquee : [...content.marquee, ...content.marquee];

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground antialiased">
      <div className={cn("mx-auto w-full max-w-6xl px-5 pb-12 pt-6 sm:px-8 lg:px-10 lg:pt-8", canEdit && "pb-28")}>
        <header className="rise flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="brand-badge relative grid size-9 place-items-center overflow-hidden rounded-full bg-primary font-display text-base font-bold text-primary-foreground shadow-soft">
              {content.logo ? (
                <img src={content.logo} alt={`Logo ${content.brand}`} className="size-full object-cover" />
              ) : (
                content.brand.trim().charAt(0).toUpperCase() || "S"
              )}
              {editing && <ImagePicker compact hasImage={content.logo !== null} maxSize={256} format="png" onChange={(next) => setField("logo", next)} />}
            </span>
            <EditableText
              as="span"
              className="font-display text-xl font-bold"
              value={content.brand}
              editing={editing}
              placeholder="Nama toko"
              onChange={(value) => setField("brand", value)}
            />
            {editing && content.logo && (
              <button type="button" onClick={() => setField("logo", null)} className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                Hapus logo
              </button>
            )}
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium shadow-soft">
            <span className="status-dot size-2 rounded-full bg-success" />
            <EditableText value={content.safeLabel} editing={editing} placeholder="Label" onChange={(value) => setField("safeLabel", value)} />
          </span>
        </header>

        <div className="mt-6 grid items-center gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8">
          <section className="promo-banner rise relative min-h-52 overflow-hidden rounded-[22px] p-5 sm:min-h-56 sm:p-7 lg:min-h-64 lg:p-9">
            <div className="relative z-10 max-w-[62%] sm:max-w-[58%]">
              <EditableText
                as="span"
                className="inline-flex rounded-full bg-primary-foreground/25 px-2.5 py-1 text-[10px] font-bold uppercase text-primary-foreground"
                value={promo.badge}
                editing={editing}
                placeholder="Label promo"
                onChange={(value) => setPromo({ badge: value })}
              />
              <EditableText
                as="h1"
                className="mt-3 text-balance font-display text-2xl font-bold leading-tight text-primary-foreground sm:text-3xl lg:text-4xl"
                value={promo.title}
                editing={editing}
                placeholder="Judul promo"
                onChange={(value) => setPromo({ title: value })}
              />
              <EditableText
                as="p"
                className={cn("mt-2 max-w-md text-sm leading-6 text-primary-foreground/85", !editing && "hidden sm:block")}
                value={promo.subtitle}
                editing={editing}
                placeholder="Sub judul"
                onChange={(value) => setPromo({ subtitle: value })}
              />
              {editing ? (
                // <button> tidak bisa diketik di semua browser, jadi saat edit dibuat tampilan tombol dari <div>.
                <div className={cn(buttonVariants({ variant: "secondary" }), "mt-4")}>
                  <EditableText value={promo.button} editing placeholder="Teks tombol" onChange={(value) => setPromo({ button: value })} />
                  <ArrowRight className="ml-2 size-4" />
                </div>
              ) : (
                <Button variant="secondary" className="mt-4" onClick={() => productsRef.current?.scrollIntoView({ behavior: "smooth" })}>
                  {promo.button} <ArrowRight className="ml-2 size-4" />
                </Button>
              )}
            </div>
            <div className="promo-picture absolute bottom-0 right-0 h-full w-[42%] overflow-hidden sm:w-[46%]">
              <EditableImage
                src={promo.image ?? promoImage}
                alt={promo.imageAlt}
                editing={editing}
                isCustom={promo.image !== null}
                onChange={(next) => setPromo({ image: next })}
                className="h-full w-full object-cover"
              />
            </div>
            <Sparkles className="promo-spark absolute right-[38%] top-5 z-10 size-5 text-primary-foreground sm:right-[43%]" aria-hidden="true" />
          </section>

          <label className="search-panel rise flex items-center gap-3 rounded-[18px] border border-border bg-card px-4 py-4 shadow-soft lg:self-stretch lg:px-6">
            <Search className="size-5 shrink-0 text-primary" aria-hidden="true" />
            <span className="sr-only">{editing ? "Ubah teks placeholder pencarian" : "Cari produk"}</span>
            {editing ? (
              <input
                value={content.searchPlaceholder}
                onChange={(event) => setField("searchPlaceholder", event.target.value)}
                title="Ubah teks petunjuk kolom pencarian"
                className="w-full bg-transparent text-sm outline-dashed outline-1 outline-offset-4 outline-primary/60"
              />
            ) : (
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={content.searchPlaceholder} className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
            )}
          </label>
        </div>

        <div className="marquee mt-5 overflow-hidden border-y border-border py-2 text-[11px] font-semibold uppercase text-muted-foreground" aria-hidden={!editing}>
          <div className={cn("flex items-center gap-8", editing ? "flex-wrap" : "marquee-track w-max")}>
            {marqueeItems.map((item, index) => (
              <span key={`${index}-${item}`} className="flex items-center gap-2">
                <Zap className="size-3 text-primary" />
                <EditableText value={item} editing={editing} placeholder="Teks" onChange={(value) => setMarquee(index, value)} />
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          <Button variant={category === "Semua" ? "default" : "secondary"} className="category-button" onClick={() => pickCategory("Semua")}><Sparkles className="mr-2 size-4" />Populer</Button>
          <Button variant={category === "Game" ? "default" : "secondary"} className="category-button" onClick={() => pickCategory("Game")}><Gamepad2 className="mr-2 size-4" />Game</Button>
          <Button variant={category === "App Premium" ? "default" : "secondary"} className="category-button" onClick={() => pickCategory("App Premium")}><Smartphone className="mr-2 size-4" />App Premium</Button>
        </div>

        {subTabs.length > 0 && !editing && (
          <div className="mt-2 flex gap-2 overflow-x-auto pb-2 no-scrollbar" role="tablist" aria-label={`Pilih ${category}`}>
            {["", ...subTabs].map((name) => (
              <Button
                key={name || "semua"}
                role="tab"
                aria-selected={activeSubTab === name}
                size="sm"
                variant={activeSubTab === name ? "default" : "outline"}
                className="shrink-0"
                onClick={() => setSubTab(name)}
              >
                {name || `Semua ${category}`}
              </Button>
            ))}
          </div>
        )}

        <section ref={productsRef} className="scroll-mt-6">
          <div className="mt-6 flex items-end justify-between gap-3">
            <div>
              <EditableText as="p" className="text-[10px] font-bold uppercase text-primary" value={content.productsEyebrow} editing={editing} placeholder="Label" onChange={(value) => setField("productsEyebrow", value)} />
              <EditableText as="h2" className="mt-1 font-display text-xl font-bold sm:text-2xl" value={content.productsTitle} editing={editing} placeholder="Judul bagian" onChange={(value) => setField("productsTitle", value)} />
            </div>
            {category !== "Semua" && !editing && <Button variant="ghost" size="sm" onClick={() => setCategory("Semua")}>Lihat semua</Button>}
          </div>

          {visibleProducts.length > 0 ? (
            <div className="product-grid mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {visibleProducts.map((product) => (
                <article key={product.id} className="product-card rise group flex min-h-48 flex-col rounded-[18px] border border-border bg-card p-4 shadow-soft sm:min-h-52 sm:p-5">
                  {(product.image || editing) && (
                    <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-[12px] bg-secondary">
                      {product.image ? (
                        <img src={product.image} alt={`${product.name} ${product.detail}`} loading="lazy" className="size-full object-cover" />
                      ) : (
                        <span className="grid size-full place-items-center text-muted-foreground"><ImageIcon className="size-6" aria-hidden="true" /></span>
                      )}
                      {!editing && product.badge && (
                        <span className="absolute right-2 top-2 rounded-md bg-gold-soft px-2 py-1 text-[10px] font-bold text-accent-foreground">{product.badge}</span>
                      )}
                      {editing && <ImagePicker hasImage={product.image !== null} maxSize={640} onChange={(next) => setProduct(product.id, { image: next })} />}
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    {(editing || !product.image) && <EditableText
                      as="span"
                      className="product-mark grid size-10 place-items-center rounded-[12px] bg-secondary font-display text-sm font-bold text-primary transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110"
                      value={product.mark}
                      editing={editing}
                      placeholder="?"
                      onChange={(value) => setProduct(product.id, { mark: value.slice(0, 3) })}
                    />}
                    {(editing || (product.badge && !product.image)) && (
                      <EditableText
                        as="span"
                        className="rounded-md bg-gold-soft px-2 py-1 text-[10px] font-bold text-accent-foreground"
                        value={product.badge}
                        editing={editing}
                        placeholder="+ label"
                        onChange={(value) => setProduct(product.id, { badge: value })}
                      />
                    )}
                  </div>
                  {editing ? (
                    <select
                      value={product.category}
                      onChange={(event) => setProduct(product.id, { category: event.target.value as ProductCategory })}
                      aria-label="Kategori produk"
                      className="mt-4 w-fit rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground"
                    >
                      <option value="Game">Game</option>
                      <option value="App Premium">App Premium</option>
                    </select>
                  ) : (
                    <p className="mt-4 text-[10px] font-bold uppercase text-muted-foreground">{product.category}</p>
                  )}
                  <EditableText as="h3" className="mt-1 font-display text-base font-bold leading-tight sm:text-lg" value={product.name} editing={editing} placeholder="Nama produk" onChange={(value) => setProduct(product.id, { name: value })} />
                  <EditableText as="p" className="mt-1 text-xs text-muted-foreground sm:text-sm" value={product.detail} editing={editing} placeholder="Detail" onChange={(value) => setProduct(product.id, { detail: value })} />
                  <div className="mt-auto pt-4">
                    <EditableText as="p" className="font-display text-base font-bold text-primary sm:text-lg" value={product.price} editing={editing} placeholder="Harga" onChange={(value) => setProduct(product.id, { price: value })} />
                    {editing ? (
                      <Button size="sm" variant="outline" className="mt-2 w-full rounded-[10px] text-destructive" onClick={() => removeProduct(product)}>
                        <Trash2 className="mr-1.5 size-3.5" />Hapus
                      </Button>
                    ) : (
                      <Button size="sm" className="mt-2 w-full rounded-[10px]" onClick={() => setCheckoutProduct(product)}>Beli</Button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-[18px] border border-border bg-card p-8 text-center shadow-soft"><Search className="mx-auto size-6 text-muted-foreground" /><p className="mt-3 font-display font-bold">Produk belum ditemukan</p><p className="mt-1 text-sm text-muted-foreground">Coba kata kunci lain.</p></div>
          )}

          {editing && (
            <Button
              variant="outline"
              className="mt-4 w-full border-dashed"
              onClick={() =>
                update((current) => ({
                  ...current,
                  products: [...current.products, newProduct(activeSubTab || "Produk baru", category === "Semua" ? "Game" : category)],
                }))
              }
            >
              <Plus className="mr-2 size-4" />Tambah produk
            </Button>
          )}
          {editing && (
            <div className="mt-3 rounded-[14px] border border-dashed border-border bg-card p-3 text-xs">
              <label className="block font-bold">
                Nomor WhatsApp untuk menerima pesanan
                <input
                  inputMode="numeric"
                  value={content.whatsapp}
                  onChange={(event) => setField("whatsapp", event.target.value.replace(/\D/g, "").slice(0, 15))}
                  placeholder="6281234567890"
                  className="mt-1 w-full rounded-[10px] border border-border bg-background px-3 py-2 text-sm font-normal outline-none focus:border-primary"
                />
              </label>
              <p className="mt-1 text-muted-foreground">Angka saja, tanpa tanda +. Contoh: 6281234567890. Kosong = checkout belum bisa dipakai.</p>
              <p className="mt-2 text-muted-foreground">Tab game/aplikasi dibuat otomatis dari nama produk. Beberapa produk dengan nama sama (mis. "Mobile Legends") menjadi satu tab berisi banyak paket.</p>
            </div>
          )}
        </section>

        {editing && (
          <PaymentEditor payments={content.payments} onChange={setPayments} />
        )}

        <div className="mt-7 flex items-center justify-center gap-3 rounded-[18px] border border-border bg-card px-4 py-4 text-xs font-semibold uppercase text-muted-foreground shadow-soft">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-success/15 text-success"><ShieldCheck className="size-4" /></span>
          <EditableText value={content.trustNote} editing={editing} placeholder="Catatan keamanan" onChange={(value) => setField("trustNote", value)} />
        </div>

        {!editing && activePayments(content.payments).length > 0 && (
          <div className="mt-3 rounded-[18px] border border-border bg-card px-4 py-3 shadow-soft">
            <p className="text-center text-[10px] font-bold uppercase text-muted-foreground">
              <EditableText value={content.paymentTitle} editing={editing} placeholder="Judul" onChange={(value) => setField("paymentTitle", value)} />
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
              {activePayments(content.payments).map((payment) => (
                <span key={payment.id} className="rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] font-bold text-foreground">
                  {payment.label}
                </span>
              ))}
            </div>
          </div>
        )}
        {editing && (
          <div className="mt-3 rounded-[18px] border border-dashed border-border bg-card px-4 py-3 shadow-soft">
            <label className="block text-xs font-semibold">
              Judul bagian pembayaran (tampil di toko)
              <input
                value={content.paymentTitle}
                onChange={(event) => setField("paymentTitle", event.target.value)}
                className="mt-1 w-full rounded-[10px] border border-border bg-background px-3 py-2 text-sm font-normal outline-none focus:border-primary"
                maxLength={80}
              />
            </label>
            <label className="mt-2 block text-xs font-semibold">
              Catatan pembayaran (tampil di langkah bayar checkout)
              <input
                value={content.paymentNote}
                onChange={(event) => setField("paymentNote", event.target.value)}
                className="mt-1 w-full rounded-[10px] border border-border bg-background px-3 py-2 text-sm font-normal outline-none focus:border-primary"
                maxLength={200}
              />
            </label>
          </div>
        )}
        <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <EditableText className="font-display font-semibold text-foreground/70" value={content.footerLeft} editing={editing} placeholder="Nama" onChange={(value) => setField("footerLeft", value)} />
          <EditableText value={content.footerRight} editing={editing} placeholder="Hak cipta" onChange={(value) => setField("footerRight", value)} />
        </footer>
      </div>

      <CheckoutDialog
        product={checkoutProduct}
        shopName={content.brand}
        whatsapp={content.whatsapp}
        payments={content.payments}
        paymentNote={content.paymentNote}
        onClose={() => setCheckoutProduct(null)}
      />

      {canEdit && (
        <div className="fixed inset-x-4 bottom-4 z-30 mx-auto flex max-w-md flex-col gap-2 rounded-[14px] border border-border bg-card p-2 shadow-soft">
          <div className="flex items-center gap-2">
            <Button size="sm" variant={editing ? "default" : "secondary"} className="flex-1" onClick={() => setEditing((value) => !value)}>
              {editing ? <><Eye className="mr-1.5 size-3.5" />Lihat hasil</> : <><Pencil className="mr-1.5 size-3.5" />Mode edit</>}
            </Button>
            {dirty && <Button size="sm" variant="outline" onClick={handleDiscard}><Undo2 className="mr-1.5 size-3.5" />Batalkan</Button>}
          </div>
          {editing && (
            <form
              className="flex items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void save(password);
              }}
            >
              <input
                type="password"
                value={password}
                onChange={(event) => changePassword(event.target.value)}
                placeholder="Password admin"
                autoComplete="current-password"
                className="h-8 min-w-0 flex-1 rounded-full border border-border bg-background px-3 text-xs outline-none focus:border-primary"
              />
              <Button type="submit" size="sm" disabled={!dirty || !password || status.kind === "saving"}>
                <Save className="mr-1.5 size-3.5" />{status.kind === "saving" ? "Menyimpan…" : "Simpan"}
              </Button>
            </form>
          )}
          <p className={cn("px-1 text-center text-[11px]", status.kind === "error" ? "text-destructive" : "text-muted-foreground")}>
            {status.kind === "error"
              ? status.message
              : status.kind === "saved"
                ? "Tersimpan. Perubahan sudah tampil untuk semua pengunjung."
                : dirty
                  ? "Ada perubahan yang belum disimpan."
                  : "Semua perubahan sudah tersimpan."}
          </p>
        </div>
      )}
    </main>
  );
}
