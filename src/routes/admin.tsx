import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Lock, Package, RefreshCw, Wallet } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  ORDER_STATUSES,
  orderStatusLabels,
  revenueByDay,
  summarizeOrders,
  type Order,
  type OrderStatus,
} from "@/lib/orders";
import { formatRupiah } from "@/lib/site-content";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — CLARE SHOP" }] }),
  component: AdminPage,
});

const SESSION_KEY = "sakura-pop:admin";

async function api(action: string, payload: Record<string, unknown> = {}) {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = (await response.json().catch(() => ({}))) as { error?: string; orders?: Order[]; ok?: boolean };
  if (!response.ok) throw new Error(data.error ?? "Gagal memuat data.");
  return data;
}

function timeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} mnt lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

const statusStyles: Record<OrderStatus, string> = {
  pending: "bg-gold-soft text-accent-foreground",
  paid: "bg-success/15 text-success",
  done: "bg-primary/10 text-primary",
  cancelled: "bg-muted text-muted-foreground",
};

function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(
    async (pw: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await api("list", { password: pw });
        setOrders(data.orders ?? []);
        setAuthed(true);
        try {
          window.sessionStorage.setItem(SESSION_KEY, pw);
        } catch {
          /* abaikan */
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat data.");
        setAuthed(false);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Pakai password yang tersimpan dari mode ?edit bila ada.
  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(SESSION_KEY) ?? "";
      if (saved) {
        setPassword(saved);
        load(saved);
      }
    } catch {
      /* abaikan */
    }
  }, [load]);

  const changeStatus = async (id: string, status: OrderStatus) => {
    setUpdatingId(id);
    try {
      await api("setStatus", { password, id, status });
      setOrders((current) => current.map((order) => (order.id === id ? { ...order, status } : order)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal mengubah status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const summary = useMemo(() => summarizeOrders(orders), [orders]);
  const daily = useMemo(() => revenueByDay(orders, 7), [orders]);
  const maxDaily = Math.max(1, ...daily.map((d) => d.total));
  const visible = useMemo(
    () => (filter === "all" ? orders : orders.filter((order) => order.status === filter)),
    [orders, filter],
  );

  if (!authed) {
    return (
      <main className="mx-auto grid min-h-screen w-full max-w-md place-items-center bg-background px-5">
        <form
          className="w-full rounded-[18px] border border-border bg-card p-6 shadow-soft"
          onSubmit={(event) => {
            event.preventDefault();
            if (password) load(password);
          }}
        >
          <span className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
            <Lock className="size-5" />
          </span>
          <h1 className="mt-3 font-display text-xl font-bold">Dashboard Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">Masuk dengan password admin untuk melihat order & penghasilan.</p>
          <label className="mt-4 block text-xs font-semibold">
            Password admin
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-[10px] border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              autoComplete="current-password"
            />
          </label>
          {error && <p className="mt-2 text-xs font-medium text-destructive" role="alert">{error}</p>}
          <Button type="submit" className="mt-4 w-full" disabled={loading || !password}>
            {loading ? "Memeriksa…" : "Masuk"}
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            <a href="/" className="underline">← Kembali ke toko</a>
          </p>
        </form>
      </main>
    );
  }

  const cards = [
    { label: "Total penghasilan", value: formatRupiah(summary.revenue), icon: Wallet, sub: `${summary.paidCount} order lunas/selesai` },
    { label: "Hari ini", value: formatRupiah(summary.todayRevenue), icon: BarChart3, sub: "penghasilan hari ini" },
    { label: "Menunggu verifikasi", value: String(summary.pendingCount), icon: Package, sub: "order belum dikonfirmasi" },
    { label: "Total order", value: String(summary.totalCount), icon: RefreshCw, sub: "semua waktu" },
  ];

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl bg-background px-4 pb-16 pt-6 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold sm:text-2xl">Dashboard Admin</h1>
          <p className="text-xs text-muted-foreground">Pantau order masuk & penghasilan toko.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => load(password)} disabled={loading}>
            <RefreshCw className={cn("mr-1.5 size-3.5", loading && "animate-spin")} />
            {loading ? "Memuat…" : "Refresh"}
          </Button>
          <a href="/" className="rounded-[10px] border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-secondary">
            Toko
          </a>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-[16px] border border-border bg-card p-4 shadow-soft">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-muted-foreground">
              <card.icon className="size-3.5" aria-hidden="true" /> {card.label}
            </p>
            <p className="mt-2 font-display text-lg font-bold text-primary sm:text-xl">{card.value}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-[16px] border border-border bg-card p-4 shadow-soft">
        <p className="text-[11px] font-bold uppercase text-muted-foreground">Penghasilan 7 hari terakhir</p>
        <div className="mt-3 flex h-28 items-end gap-2">
          {daily.map((day) => (
            <div key={day.date} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <div className="flex h-20 w-full items-end">
                <div
                  className="w-full rounded-t-md bg-primary/80"
                  style={{ height: `${Math.max(3, (day.total / maxDaily) * 100)}%` }}
                  title={`${day.label}: ${formatRupiah(day.total)}`}
                />
              </div>
              <span className="truncate text-[10px] text-muted-foreground">{day.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {(["all", ...ORDER_STATUSES] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              filter === value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/50",
            )}
          >
            {value === "all" ? `Semua (${orders.length})` : `${orderStatusLabels[value]} (${orders.filter((o) => o.status === value).length})`}
          </button>
        ))}
      </div>

      {error && <p className="mt-3 text-xs font-medium text-destructive" role="alert">{error}</p>}

      <div className="mt-3 grid gap-3">
        {visible.length === 0 && (
          <div className="rounded-[16px] border border-dashed border-border bg-card p-8 text-center">
            <Package className="mx-auto size-6 text-muted-foreground" />
            <p className="mt-2 font-display font-bold">Belum ada order</p>
            <p className="mt-1 text-sm text-muted-foreground">Order baru otomatis tercatat di sini saat pembeli checkout.</p>
          </div>
        )}
        {visible.map((order) => (
          <article key={order.id} className="rounded-[16px] border border-border bg-card p-4 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display font-bold leading-tight">
                  {order.product_name}
                  {order.variant_label && <span className="text-primary"> · {order.variant_label}</span>}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {order.qty}× · {order.payment_label || "-"} · {timeAgo(order.created_at)}
                </p>
                {(order.target || order.buyer_name || order.note) && (
                  <p className="mt-1.5 text-xs leading-5">
                    {order.target && <><span className="text-muted-foreground">Tujuan:</span> {order.target}<br /></>}
                    {order.buyer_name && <><span className="text-muted-foreground">Nama:</span> {order.buyer_name}<br /></>}
                    {order.note && <><span className="text-muted-foreground">Catatan:</span> {order.note}</>}
                  </p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className="font-display text-base font-bold text-primary">{formatRupiah(order.total)}</p>
                <span className={cn("mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold", statusStyles[order.status])}>
                  {orderStatusLabels[order.status]}
                </span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
              {ORDER_STATUSES.filter((s) => s !== order.status).map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={updatingId === order.id}
                  onClick={() => changeStatus(order.id, s)}
                  className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-50"
                >
                  → {orderStatusLabels[s]}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
