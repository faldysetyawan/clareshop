import { ArrowLeft, Check, Copy, Landmark, MessageCircle, Minus, Plus, QrCode, Smartphone, Wallet } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { activePayments, formatRupiah, parseRupiah, paymentTypeLabels, type PaymentMethod, type PaymentType, type Product } from "@/lib/site-content";
import { cn } from "@/lib/utils";

const MAX_QTY = 10;

/** 08123… -> 628123…; sisanya hanya diambil angkanya. */
function whatsappNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
}

const typeIcons: Record<PaymentType, typeof Landmark> = {
  bank: Landmark,
  ewallet: Wallet,
  qris: QrCode,
};

const typeOrder: PaymentType[] = ["bank", "ewallet", "qris"];

type CheckoutDialogProps = {
  product: Product | null;
  shopName: string;
  whatsapp: string;
  payments: PaymentMethod[];
  paymentNote: string;
  onClose: () => void;
};

export function CheckoutDialog({ product, shopName, whatsapp, payments, paymentNote, onClose }: CheckoutDialogProps) {
  return (
    <Dialog open={product !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-[18px]">
        {/* key: formulir dikosongkan setiap ganti produk */}
        {product && (
          <CheckoutForm
            key={product.id}
            product={product}
            shopName={shopName}
            whatsapp={whatsapp}
            payments={payments}
            paymentNote={paymentNote}
            onDone={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CheckoutForm({
  product,
  shopName,
  whatsapp,
  payments,
  paymentNote,
  onDone,
}: {
  product: Product;
  shopName: string;
  whatsapp: string;
  payments: PaymentMethod[];
  paymentNote: string;
  onDone: () => void;
}) {
  const available = activePayments(payments);
  const [step, setStep] = useState<"form" | "pay">("form");
  const [qty, setQty] = useState(1);
  const [target, setTarget] = useState("");
  const [buyer, setBuyer] = useState("");
  const [note, setNote] = useState("");
  const [paymentId, setPaymentId] = useState<string>(available[0]?.id ?? "");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const variants = product.variants ?? [];
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const variant = variants.find((item) => item.id === variantId) ?? variants[0] ?? null;

  const isGame = product.category === "Game";
  const unitPrice = variant ? parseRupiah(variant.price) : parseRupiah(product.price);
  const total = unitPrice === null ? null : unitPrice * qty;
  const number = whatsappNumber(whatsapp);
  const payment = available.find((item) => item.id === paymentId) ?? null;

  const nextFromForm = () => {
    if (!number) {
      setError("Nomor WhatsApp toko belum diatur. Hubungi admin toko.");
      return;
    }
    if (!target.trim()) {
      setError(isGame ? "Isi ID game tujuan dulu." : "Isi email atau nomor akun tujuan dulu.");
      return;
    }
    if (!payment) {
      setError("Pilih metode pembayaran dulu.");
      return;
    }
    setError(null);
    setStep("pay");
  };

  const copyNumber = async () => {
    if (!payment?.accountNumber) return;
    try {
      await navigator.clipboard.writeText(payment.accountNumber);
    } catch {
      // Clipboard API diblokir: tandai manual saja.
      const selection = window.getSelection();
      const range = document.createRange();
      const element = document.getElementById("payment-account-number");
      if (element && selection) {
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const submit = () => {
    if (!payment) return;
    const lines = [
      `Halo ${shopName}, saya mau order:`,
      `Produk: ${product.name}${variant ? ` (${variant.label})` : ""} - ${product.detail}`,
      variant ? `Durasi: ${variant.label}` : "",
      `Jumlah: ${qty}`,
      total !== null ? `Total: ${formatRupiah(total)}` : `Harga: ${variant?.price ?? product.price}`,
      `Pembayaran: ${payment.label} (${paymentTypeLabels[payment.type]})`,
      `${isGame ? "ID game" : "Akun tujuan"}: ${target.trim()}`,
      buyer.trim() ? `Nama: ${buyer.trim()}` : "",
      note.trim() ? `Catatan: ${note.trim()}` : "",
      `Saya sudah bayar, mohon diproses.`,
    ].filter(Boolean);
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener");
    onDone();
  };

  const fieldClass =
    "mt-1 w-full rounded-[10px] border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

  return (
    <div className="grid gap-4">
      <DialogHeader>
        <DialogTitle className="font-display">Checkout</DialogTitle>
        <DialogDescription>
          {step === "form"
            ? "Isi data di bawah, lalu pilih metode pembayaran."
            : "Selesaikan pembayaran, lalu konfirmasi via WhatsApp."}
        </DialogDescription>
      </DialogHeader>

      <div className="flex items-center gap-3 rounded-[14px] bg-secondary p-3">
        {product.image ? (
          <img src={product.image} alt="" className="size-14 shrink-0 rounded-[10px] object-cover" />
        ) : (
          <span className="grid size-14 shrink-0 place-items-center rounded-[10px] bg-card font-display text-sm font-bold text-primary">
            {product.mark}
          </span>
        )}
        <div className="min-w-0">
          <p className="font-display font-bold leading-tight">{product.name}</p>
          <p className="text-xs text-muted-foreground">{product.detail}</p>
          <p className="mt-1 font-display text-sm font-bold text-primary">
            {variant ? `${variant.label} · ${variant.price}` : product.price}
          </p>
        </div>
      </div>

      {step === "form" && variants.length > 0 && (
        <label className="block text-xs font-semibold">
          {isGame ? "Pilih paket" : "Durasi langganan"}
          <select
            value={variant?.id ?? ""}
            onChange={(event) => setVariantId(event.target.value)}
            className={fieldClass}
            aria-label={isGame ? "Pilih paket" : "Durasi langganan"}
          >
            {variants.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label} · {item.price}
              </option>
            ))}
          </select>
        </label>
      )}

      {step === "form" ? (
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            nextFromForm();
          }}
        >
          <label className="block text-xs font-semibold">
            {isGame ? "ID game (beserta Zone ID jika ada)" : "Email atau nomor akun tujuan"}
            <input value={target} onChange={(event) => setTarget(event.target.value)} className={fieldClass} maxLength={120} autoComplete="off" />
          </label>

          <label className="block text-xs font-semibold">
            Nama (opsional)
            <input value={buyer} onChange={(event) => setBuyer(event.target.value)} className={fieldClass} maxLength={60} autoComplete="name" />
          </label>

          <label className="block text-xs font-semibold">
            Catatan (opsional)
            <input value={note} onChange={(event) => setNote(event.target.value)} className={fieldClass} maxLength={200} />
          </label>

          <fieldset>
            <legend className="text-xs font-semibold">Metode pembayaran</legend>
            {available.length === 0 ? (
              <p className="mt-2 rounded-[10px] border border-dashed border-border p-3 text-xs text-muted-foreground">
                Metode pembayaran belum diatur admin. Hubungi admin via WhatsApp untuk membayar.
              </p>
            ) : (
              <div className="mt-2 grid gap-2">
                {typeOrder.map((type) => {
                  const group = available.filter((item) => item.type === type);
                  if (group.length === 0) return null;
                  const Icon = typeIcons[type];
                  return (
                    <div key={type}>
                      <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase text-muted-foreground">
                        <Icon className="size-3.5" aria-hidden="true" /> {paymentTypeLabels[type]}
                      </p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-label={paymentTypeLabels[type]}>
                        {group.map((item) => {
                          const selected = item.id === paymentId;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              onClick={() => setPaymentId(item.id)}
                              className={cn(
                                "rounded-[12px] border px-3 py-2.5 text-left text-sm font-semibold transition-colors",
                                selected
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border bg-card text-foreground hover:border-primary/50",
                              )}
                            >
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </fieldset>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button type="button" size="icon" variant="outline" className="size-8" aria-label="Kurangi jumlah" disabled={qty <= 1} onClick={() => setQty((value) => Math.max(1, value - 1))}>
                <Minus className="size-3.5" />
              </Button>
              <span className="w-6 text-center text-sm font-bold" aria-live="polite">{qty}</span>
              <Button type="button" size="icon" variant="outline" className="size-8" aria-label="Tambah jumlah" disabled={qty >= MAX_QTY} onClick={() => setQty((value) => Math.min(MAX_QTY, value + 1))}>
                <Plus className="size-3.5" />
              </Button>
            </div>
            <p className="text-right text-sm">
              Total <strong className="font-display text-base text-primary">{total !== null ? formatRupiah(total) : product.price}</strong>
            </p>
          </div>

          {error && <p className="text-xs font-medium text-destructive" role="alert">{error}</p>}

          <Button type="submit" className="w-full" disabled={available.length === 0}>
            Lanjut ke pembayaran
          </Button>
        </form>
      ) : (
        <div className="grid gap-4">
          {payment && (
            <div className="rounded-[14px] border border-border bg-card p-4">
              <p className="text-[11px] font-bold uppercase text-muted-foreground">
                {paymentTypeLabels[payment.type]} · {payment.label}
              </p>
              {payment.type === "qris" ? (
                <div className="mt-3 grid place-items-center gap-2">
                  {payment.image ? (
                    <img src={payment.image} alt={`Kode QR ${payment.label}`} className="size-48 rounded-[12px] border border-border bg-white object-contain p-2" />
                  ) : (
                    <p className="rounded-[10px] bg-secondary p-4 text-center text-xs text-muted-foreground">
                      Kode QR belum dipasang admin. Minta kode QR via WhatsApp.
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-3">
                  <p className="text-[11px] text-muted-foreground">Nomor tujuan</p>
                  <div className="mt-1 flex items-center gap-2">
                    <p id="payment-account-number" className="font-display text-xl font-bold tracking-wide">
                      {payment.accountNumber || "—"}
                    </p>
                    {payment.accountNumber && (
                      <Button type="button" size="sm" variant="outline" onClick={copyNumber} aria-label="Salin nomor">
                        {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                        <span className="ml-1.5">{copied ? "Tersalin" : "Salin"}</span>
                      </Button>
                    )}
                  </div>
                  {payment.accountName && (
                    <p className="mt-1 text-sm text-muted-foreground">a.n. {payment.accountName}</p>
                  )}
                </div>
              )}
              {payment.note && <p className="mt-3 text-xs leading-5 text-muted-foreground">{payment.note}</p>}
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <span className="text-sm text-muted-foreground">Total dibayar</span>
                <strong className="font-display text-lg text-primary">{total !== null ? formatRupiah(total) : product.price}</strong>
              </div>
            </div>
          )}
          {paymentNote && <p className="text-center text-xs text-muted-foreground">{paymentNote}</p>}

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="shrink-0" onClick={() => setStep("form")}>
              <ArrowLeft className="mr-1.5 size-4" /> Kembali
            </Button>
            <Button type="button" className="w-full" onClick={submit}>
              <MessageCircle className="mr-2 size-4" /> Saya sudah bayar
            </Button>
          </div>
          <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
            <Smartphone className="size-3.5" aria-hidden="true" />
            Setelah bayar, pesanan & bukti pembayaran dikirim ke WhatsApp admin.
          </p>
        </div>
      )}
    </div>
  );
}

// Re-export agar route bisa memakai helper yang sama tanpa duplikasi logika.
export { activePayments };
