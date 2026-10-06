import { createFileRoute } from "@tanstack/react-router";

// API order: dicatat otomatis saat pembeli checkout, dibaca/diubah lewat dashboard admin.
// CORS dibuka agar dashboard admin terpisah (web lain) bisa mengakses endpoint ini.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
};

export const Route = createFileRoute("/api/orders")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          return Response.json({ error: "Permintaan tidak valid." }, { status: 400, headers: corsHeaders });
        }
        const { action, password, order, id, status } = (payload ?? {}) as {
          action?: unknown;
          password?: unknown;
          order?: unknown;
          id?: unknown;
          status?: unknown;
        };
        const { createOrder, listOrders, setOrderStatus } = await import("@/lib/orders.server");

        if (action === "create") {
          const result = await createOrder(order);
          return Response.json(result, { headers: corsHeaders });
        }
        if (action === "list") {
          const result = await listOrders(password);
          return Response.json(result.body, { status: result.status, headers: corsHeaders });
        }
        if (action === "setStatus") {
          const result = await setOrderStatus(password, id, status);
          return Response.json(result.body, { status: result.status, headers: corsHeaders });
        }
        return Response.json({ error: "Aksi tidak dikenal." }, { status: 400, headers: corsHeaders });
      },
    },
  },
});
