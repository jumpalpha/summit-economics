import { ArtIcon } from "@/components/art-icon";
import { Btn } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-6 pb-24 pt-40 text-center">
      <div className="mx-auto grid size-40 animate-float place-items-center"><ArtIcon fallback="🧭" size={160} /></div>
      <h1 className="mt-6 font-display text-5xl font-extrabold tracking-tight">You wandered <span className="text-gradient">off trail.</span></h1>
      <p className="mt-3 text-lg text-muted">There&apos;s nothing to mine at this address.</p>
      <div className="mt-8"><Btn href="/">Back to the World Map</Btn></div>
    </div>
  );
}
