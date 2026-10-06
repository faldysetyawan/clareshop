import { createFileRoute } from "@tanstack/react-router";

// Simpan perubahan dari mode edit. Perlu password admin (variabel ADMIN_PASSWORD di server).
export const Route = createFileRoute("/api/content")({
  server: {
    handlers: {
      PUT: async ({ request }) => {
        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          return Response.json({ error: "Permintaan tidak valid." }, { status: 400 });
        }
        const { saveContent } = await import("@/lib/content.server");
        const result = await saveContent(payload);
        return Response.json(result.body, { status: result.status });
      },
    },
  },
});
