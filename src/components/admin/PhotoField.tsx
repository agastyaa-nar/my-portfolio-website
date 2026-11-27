import { useState } from "react";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { Crop, Loader2, RotateCcw, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Portrait } from "@/components/folio/Portrait";
import { inputCls, upload } from "./FieldInput";
import type { PhotoCrop } from "@/data/types";

const ASPECT = 2 / 3; // matches the portrait frame on the site

function CropDialog({ url, initial, open, onClose, onSave }: { url: string; initial: PhotoCrop | null; open: boolean; onClose: () => void; onSave: (c: PhotoCrop) => void }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<PhotoCrop | null>(initial);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Adjust photo</DialogTitle>
          <DialogDescription>Drag to move the photo, use the slider to zoom. This is exactly what visitors will see in the frame.</DialogDescription>
        </DialogHeader>
        <div className="relative h-[min(60vh,520px)] w-full overflow-hidden rounded-lg bg-muted">
          <Cropper
            image={url} crop={crop} zoom={zoom} minZoom={1} maxZoom={4} aspect={ASPECT}
            initialCroppedAreaPercentages={initial ?? undefined}
            onCropChange={setCrop} onZoomChange={setZoom}
            onCropComplete={(pct) => setArea({ x: pct.x, y: pct.y, width: pct.width, height: pct.height })}
          />
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Zoom</span>
          <Slider min={1} max={4} step={0.01} value={[zoom]} onValueChange={(v) => setZoom(v[0])} aria-label="Zoom" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!area} onClick={() => area && onSave(area)}>Save framing</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Upload a photo, then frame it. Framing can be changed later without re-uploading. */
export function PhotoField({ url, crop, onChange }: { url: string | null; crop: PhotoCrop | null; onChange: (url: string | null, crop: PhotoCrop | null) => void }) {
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);

  const pick = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try { const u = await upload(file, "profile"); onChange(u, null); setEditing(true); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Upload failed"); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-3">
      <span className="block text-sm font-medium">Profile photo</span>
      <div className="flex flex-wrap items-start gap-5">
        <div className="h-36 w-24 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
          {url ? <Portrait src={url} crop={crop} alt="Current portrait" /> : <div className="flex h-full items-center justify-center px-2 text-center text-xs text-muted-foreground">No photo</div>}
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <input className={inputCls} placeholder="Photo URL (or upload →)" value={url ?? ""} onChange={(e) => onChange(e.target.value || null, null)} />
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:border-primary/50">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload new photo
              <input type="file" hidden accept="image/png,image/jpeg,image/webp" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
            </label>
            <Button type="button" variant="outline" disabled={!url} onClick={() => setEditing(true)}><Crop className="mr-2 h-4 w-4" />Adjust framing</Button>
            <Button type="button" variant="ghost" disabled={!crop} onClick={() => onChange(url, null)}><RotateCcw className="mr-2 h-4 w-4" />Reset</Button>
          </div>
          <p className="text-xs text-muted-foreground">Remember to press Save at the bottom to publish the change.</p>
        </div>
      </div>
      {url && editing && <CropDialog key={url} url={url} initial={crop} open onClose={() => setEditing(false)} onSave={(c) => { onChange(url, c); setEditing(false); }} />}
    </div>
  );
}
