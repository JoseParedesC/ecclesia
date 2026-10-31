import { ImagePlus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "../../components/ui";

const MAX_SIDE = 256;

/** Lee la imagen, la reduce a 256 px y la devuelve como data URL PNG (así el logo pesa pocos KB). */
function resize(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * k));
      canvas.height = Math.max(1, Math.round(img.height * k));
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("No se pudo leer la imagen.")); };
    img.src = url;
  });
}

export function LogoField({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  async function pick(file?: File) {
    if (!file) return;
    setError("");
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return setError("Usa una imagen PNG, JPG o WEBP.");
    if (file.size > 5 * 1024 * 1024) return setError("La imagen pesa más de 5 MB.");
    try { onChange(await resize(file)); } catch (e) { setError((e as Error).message); }
    if (input.current) input.current.value = "";
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted">Logo (opcional)</span>
      <div className="flex flex-wrap items-center gap-4">
        <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-xl border border-dashed border-line bg-mist/60">
          {value ? <img src={value} alt="Logo de la parroquia" className="h-full w-full bg-white object-contain p-1" /> : <ImagePlus className="h-6 w-6 text-muted" aria-hidden="true" />}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button size="sm" onClick={() => input.current?.click()}><ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />{value ? "Cambiar" : "Subir logo"}</Button>
            {value && <Button size="sm" variant="ghost" className="text-danger hover:bg-danger-soft" onClick={() => onChange(null)}><Trash2 className="h-3.5 w-3.5" aria-hidden="true" />Quitar</Button>}
          </div>
          <p className="text-xs text-muted">PNG, JPG o WEBP. Se ajusta automáticamente a 256 px.</p>
        </div>
        <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label="Archivo del logo" onChange={(e) => void pick(e.target.files?.[0])} />
      </div>
      {error && <p className="animate-slide-down text-xs text-danger">{error}</p>}
    </div>
  );
}
