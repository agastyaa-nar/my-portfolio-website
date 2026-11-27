import type { PhotoCrop } from "@/data/types";

/**
 * Shows the saved part of a photo inside a frame of the SAME aspect ratio as the cropper (2:3).
 * No crop saved = plain object-cover. The original image is never modified.
 */
export function Portrait({ src, crop, alt, className = "" }: { src: string; crop?: PhotoCrop | null; alt: string; className?: string }) {
  if (!crop || !crop.width || !crop.height) return <img src={src} alt={alt} className={`h-full w-full object-cover ${className}`} />;
  return (
    <div className="relative h-full w-full overflow-hidden">
      <img
        src={src} alt={alt}
        className={className}
        style={{ position: "absolute", maxWidth: "none", width: `${10000 / crop.width}%`, left: `${(-crop.x / crop.width) * 100}%`, top: `${(-crop.y / crop.height) * 100}%` }}
      />
    </div>
  );
}

/** For round avatars: keep the centre of the saved framing in view. */
export const focus = (crop?: PhotoCrop | null) => (crop ? `${crop.x + crop.width / 2}% ${crop.y + crop.height / 2}%` : "50% 30%");
