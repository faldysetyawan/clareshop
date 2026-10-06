import { ImagePlus, Undo2 } from "lucide-react";
import { useRef, useState, type ClipboardEvent, type ElementType, type FocusEvent, type KeyboardEvent } from "react";

type EditableTextProps = {
  value: string;
  onChange: (value: string) => void;
  editing: boolean;
  as?: ElementType;
  className?: string;
  placeholder?: string;
};

/**
 * Teks biasa saat `editing` false; saat true bisa diketik langsung di tempat.
 * Perubahan disimpan ketika fokus berpindah (blur) atau menekan Enter.
 */
export function EditableText({
  value,
  onChange,
  editing,
  as = "span",
  className,
  placeholder,
}: EditableTextProps) {
  const Tag = as as ElementType;
  // Remount elemen setelah blur supaya DOM contentEditable selalu sinkron dengan state React.
  const [revision, setRevision] = useState(0);

  if (!editing) return <Tag className={className}>{value}</Tag>;

  return (
    <Tag
      key={revision}
      className={className}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      data-placeholder={placeholder}
      onBlur={(event: FocusEvent<HTMLElement>) => {
        const next = (event.currentTarget.textContent ?? "").replace(/\s+/g, " ").trim();
        if (next !== value) onChange(next);
        setRevision((r) => r + 1);
      }}
      onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
        if (event.key === "Enter") {
          event.preventDefault();
          event.currentTarget.blur();
        }
      }}
      onPaste={(event: ClipboardEvent<HTMLElement>) => {
        event.preventDefault();
        const text = event.clipboardData.getData("text/plain").replace(/\s+/g, " ");
        document.execCommand("insertText", false, text);
      }}
    >
      {value}
    </Tag>
  );
}

type ImageOptions = { maxSize?: number; format?: "jpeg" | "png" };

/** Perkecil gambar di browser agar muat di penyimpanan dan cepat dimuat. */
async function fileToDataUrl(file: File, { maxSize = 1000, format = "jpeg" }: ImageOptions = {}): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas tidak tersedia");
  if (format === "jpeg") {
    context.fillStyle = "#ffffff"; // PNG transparan -> latar putih saat jadi JPEG
    context.fillRect(0, 0, width, height);
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return format === "png" ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.85);
}

type ImagePickerProps = ImageOptions & {
  hasImage: boolean;
  /** string = gambar baru (data URL), null = hapus / kembali ke bawaan */
  onChange: (next: string | null) => void;
  /** Tombol ikon saja, untuk area kecil seperti logo */
  compact?: boolean;
  clearLabel?: string;
};

/** Lapisan tombol unggah gambar. Taruh di dalam wadah ber-`position` (relative/absolute). */
export function ImagePicker({ hasImage, onChange, compact = false, clearLabel = "Hapus gambar", ...options }: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      onChange(await fileToDataUrl(file, options));
    } catch {
      setError("Gambar tidak bisa dibaca.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={(event) => void handleFile(event.target.files?.[0])}
    />
  );

  if (compact) {
    return (
      <>
        {input}
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          aria-label="Ganti gambar"
          className="absolute inset-0 z-20 grid place-items-center bg-foreground/40 text-background"
        >
          <ImagePlus className="size-4" aria-hidden="true" />
        </button>
      </>
    );
  }

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-foreground/35 p-2 text-center">
      {input}
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-soft disabled:opacity-60"
      >
        <ImagePlus className="size-3.5" aria-hidden="true" />
        {busy ? "Memproses…" : hasImage ? "Ganti gambar" : "Tambah gambar"}
      </button>
      {hasImage && (
        <button
          type="button"
          onClick={() => {
            setError(null);
            onChange(null);
          }}
          className="inline-flex items-center gap-1.5 rounded-full bg-card/80 px-3 py-1 text-[11px] font-semibold text-foreground"
        >
          <Undo2 className="size-3" aria-hidden="true" />
          {clearLabel}
        </button>
      )}
      {error && <p className="rounded bg-card px-2 py-1 text-[11px] text-destructive">{error}</p>}
    </div>
  );
}

type EditableImageProps = {
  src: string;
  alt: string;
  editing: boolean;
  isCustom: boolean;
  onChange: (next: string | null) => void;
  className?: string;
};

/** Gambar dengan tombol ganti saat mode edit. Harus ditaruh di dalam wadah ber-`position`. */
export function EditableImage({ src, alt, editing, isCustom, onChange, className }: EditableImageProps) {
  return (
    <>
      <img src={src} alt={alt} width={640} height={640} className={className} />
      {editing && <ImagePicker hasImage={isCustom} onChange={onChange} clearLabel="Pakai gambar awal" />}
    </>
  );
}
