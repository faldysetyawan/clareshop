import { createServerFn } from "@tanstack/react-start";

import type { SiteContent } from "./site-content";

/** Dipanggil route "/" saat render halaman; null = pakai isi bawaan. */
export const getSiteContent = createServerFn({ method: "GET" }).handler(async (): Promise<SiteContent | null> => {
  const { loadContent } = await import("./content.server");
  return loadContent();
});
