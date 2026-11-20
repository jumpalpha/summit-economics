/** Emoji icon (Summit has no image art yet; drop PNGs in /public/art/ and switch this back to <Image> if you add some). */
export function ArtIcon({ fallback, size, className = "" }: { slug?: string | null; fallback: string; size: number; className?: string }) {
  return <span aria-hidden className={`inline-grid place-items-center leading-none ${className}`} style={{ fontSize: size * 0.55, width: size, height: size }}>{fallback}</span>;
}
