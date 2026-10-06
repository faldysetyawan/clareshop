import { ImagePlus, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ImagePicker } from "@/components/editable";
import {
  newPaymentMethod,
  paymentTypeLabels,
  type PaymentMethod,
  type PaymentType,
} from "@/lib/site-content";
import { cn } from "@/lib/utils";

const typeOrder: PaymentType[] = ["bank", "ewallet", "qris"];

type PaymentEditorProps = {
  payments: PaymentMethod[];
  onChange: (payments: PaymentMethod[]) => void;
};

const inputClass =
  "w-full rounded-[10px] border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

/**
 * Kelola daftar metode pembayaran (bank / e-wallet / QRIS).
 * Hanya dipakai saat mode edit aktif.
 */
export function PaymentEditor({ payments, onChange }: PaymentEditorProps) {
  const setPayment = (id: string, patch: Partial<PaymentMethod>) =>
    onChange(payments.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  const removePayment = (payment: PaymentMethod) => {
    if (!window.confirm(`Hapus metode pembayaran "${payment.label}"?`)) return;
    onChange(payments.filter((item) => item.id !== payment.id));
  };

  return (
    <section className="mt-8 rounded-[18px] border border-dashed border-border bg-card p-4 shadow-soft sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">Metode pembayaran</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Ditampilkan di checkout: Transfer Bank, E-Wallet, dan QRIS. Nonaktifkan yang belum siap.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        {payments.map((payment) => (
          <PaymentCard
            key={payment.id}
            payment={payment}
            onPatch={(patch) => setPayment(payment.id, patch)}
            onRemove={() => removePayment(payment)}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {typeOrder.map((type) => (
          <Button
            key={type}
            type="button"
            variant="outline"
            size="sm"
            className="border-dashed"
            onClick={() => onChange([...payments, newPaymentMethod(type)])}
          >
            <Plus className="mr-1.5 size-3.5" /> Tambah {paymentTypeLabels[type]}
          </Button>
        ))}
      </div>
    </section>
  );
}

function PaymentCard({
  payment,
  onPatch,
  onRemove,
}: {
  payment: PaymentMethod;
  onPatch: (patch: Partial<PaymentMethod>) => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={cn(
        "rounded-[14px] border border-border bg-background p-3",
        !payment.active && "opacity-60",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={payment.type}
          onChange={(event) => onPatch({ type: event.target.value as PaymentType })}
          aria-label="Jenis metode"
          className="rounded-[10px] border border-border bg-card px-2 py-1.5 text-xs font-bold"
        >
          {typeOrder.map((type) => (
            <option key={type} value={type}>
              {paymentTypeLabels[type]}
            </option>
          ))}
        </select>
        <input
          value={payment.label}
          onChange={(event) => onPatch({ label: event.target.value })}
          placeholder="Nama, mis. BCA / DANA / QRIS"
          aria-label="Nama metode"
          className={cn(inputClass, "min-w-32 flex-1 font-bold")}
          maxLength={40}
        />
        <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs font-semibold text-muted-foreground">
          <input
            type="checkbox"
            checked={payment.active}
            onChange={(event) => onPatch({ active: event.target.checked })}
            className="size-4 accent-primary"
          />
          Aktif
        </label>
        <Button type="button" size="icon" variant="ghost" className="size-8 text-destructive" onClick={onRemove} aria-label={`Hapus ${payment.label}`}>
          <Trash2 className="size-4" />
        </Button>
      </div>

      {payment.type === "qris" ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="relative size-24 shrink-0 overflow-hidden rounded-[12px] border border-border bg-white">
            {payment.image ? (
              <img src={payment.image} alt="Kode QR" className="size-full object-contain p-1" />
            ) : (
              <span className="grid size-full place-items-center text-muted-foreground">
                <ImagePlus className="size-6" aria-hidden="true" />
              </span>
            )}
            <ImagePicker
              compact
              hasImage={payment.image !== null}
              maxSize={800}
              format="png"
              onChange={(next) => onPatch({ image: next })}
            />
          </div>
          <div className="min-w-48 flex-1">
            <label className="block text-xs font-semibold">
              Nama pemilik / merchant
              <input
                value={payment.accountName}
                onChange={(event) => onPatch({ accountName: event.target.value })}
                placeholder="Sakura Pop"
                className={inputClass}
                maxLength={80}
              />
            </label>
          </div>
        </div>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className="block text-xs font-semibold">
            Nomor {payment.type === "bank" ? "rekening" : "e-wallet"}
            <input
              value={payment.accountNumber}
              onChange={(event) => onPatch({ accountNumber: event.target.value })}
              placeholder={payment.type === "bank" ? "1234567890" : "081234567890"}
              inputMode="numeric"
              className={cn(inputClass, "font-mono")}
              maxLength={40}
            />
          </label>
          <label className="block text-xs font-semibold">
            Nama pemilik
            <input
              value={payment.accountName}
              onChange={(event) => onPatch({ accountName: event.target.value })}
              placeholder="Nama pemilik rekening"
              className={inputClass}
              maxLength={80}
            />
          </label>
        </div>
      )}

      <label className="mt-2 block text-xs font-semibold">
        Catatan untuk pembeli (opsional)
        <input
          value={payment.note}
          onChange={(event) => onPatch({ note: event.target.value })}
          placeholder="Mis. cantumkan nama di berita transfer"
          className={inputClass}
          maxLength={200}
        />
      </label>
    </div>
  );
}
