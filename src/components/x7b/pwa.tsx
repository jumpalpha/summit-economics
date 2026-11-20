"use client";
// ── wave-x7b ── installable app + offline mode (twin of Dopps Class pwa.js).
// PwaRegister: turns on the service worker (public/sw.js) on every page of the built site.
// InstallButton: "Install the app". Chrome, Edge and Android get the browser's own install prompt;
// iPhone, iPad and Mac Safari (no prompt) get step-by-step instructions instead. Hidden once installed.
import { useEffect, useState } from "react";
import { SITE } from "@/data/config";

type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
const KEY = "summit_app_installed";
let deferred: BIP | null = null;
const listeners = new Set<() => void>();
const ping = () => listeners.forEach((f) => f());

export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator) || location.protocol === "file:") return;
    const go = () => navigator.serviceWorker.register("/sw.js").catch(() => {});
    if (document.readyState === "complete") go(); else window.addEventListener("load", go, { once: true });
    const onPrompt = (e: Event) => { e.preventDefault(); deferred = e as BIP; try { localStorage.removeItem(KEY); } catch {} ping(); };
    const onInstalled = () => { try { localStorage.setItem(KEY, "1"); } catch {} deferred = null; ping(); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);
  return null;
}

function platform() {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return {
    ios, macSafari: !ios && /Macintosh/.test(ua) && /Safari\//.test(ua) && !/Chrome|Chromium|Edg|Firefox/.test(ua),
    android: /Android/.test(ua), firefox: /Firefox\//.test(ua), edge: /Edg\//.test(ua), samsung: /SamsungBrowser/.test(ua),
  };
}

export function InstallButton({ className = "btn-block !text-sm" }: { className?: string }) {
  const [show, setShow] = useState(false);
  const [tip, setTip] = useState(false);
  useEffect(() => {
    const standalone = matchMedia("(display-mode: standalone)").matches || matchMedia("(display-mode: fullscreen)").matches || (navigator as { standalone?: boolean }).standalone === true;
    if (standalone) { try { localStorage.setItem(KEY, "1"); } catch {} return; }
    const update = () => { let installed = false; try { installed = localStorage.getItem(KEY) === "1"; } catch {} setShow(!!deferred || !installed); };
    update(); listeners.add(update);
    return () => { listeners.delete(update); };
  }, []);
  if (!show) return null;
  const click = async () => {
    if (deferred) { const d = deferred; await d.prompt(); const c = await d.userChoice; if (c.outcome === "accepted") { try { localStorage.setItem(KEY, "1"); } catch {} setShow(false); } deferred = null; }
    else setTip(true);
  };
  return (
    <span data-pwa-install>
      <button type="button" onClick={click} className={className} data-testid="install-app">📲 Install the {SITE.name} app</button>
      {tip && <InstallTip onClose={() => setTip(false)} />}
    </span>
  );
}

function InstallTip({ onClose }: { onClose: () => void }) {
  const p = platform();
  const steps: React.ReactNode[] = p.ios
    ? [<>Tap the <b>Share</b> button <span className="rounded border border-sky px-1 font-black text-sky">⬆</span> (bottom of the screen on iPhone, top on iPad; top right in Chrome).</>, <>Scroll down and tap <b>Add to Home Screen</b>.</>, <>Tap <b>Add</b>.</>]
    : p.macSafari ? [<>In the menu bar, click <b>File</b> → <b>Add to Dock…</b></>, <>Click <b>Add</b>.</>]
    : p.android && p.firefox ? [<>Tap the <b>⋮</b> menu.</>, <>Tap <b>Install</b> (or <b>Add to Home screen</b>).</>]
    : p.android && p.samsung ? [<>Tap the <b>☰</b> menu at the bottom.</>, <>Tap <b>Add page to</b> → <b>Home screen</b>.</>]
    : p.android ? [<>Tap the <b>⋮</b> menu at the top right.</>, <>Tap <b>Add to Home screen</b> or <b>Install app</b>.</>, <>Tap <b>Install</b>.</>]
    : p.firefox ? [<>Firefox on a computer can&apos;t install web apps.</>, <>Open <b>{SITE.domain}</b> in <b>Chrome</b> or <b>Edge</b> and use this button there, or just bookmark this page (<b>Ctrl+D</b>).</>]
    : p.edge ? [<>Click the <b>⋯</b> menu at the top right.</>, <>Choose <b>Apps</b> → <b>Install this site as an app</b>.</>, <>Click <b>Install</b>.</>]
    : [<>Look for the <b>install icon</b> (a little screen with a ⬇ arrow) at the right end of the address bar and click it.</>, <>No icon? Click the <b>⋮</b> menu → <b>Cast, save, and share</b> → <b>Install page as app…</b></>, <>Click <b>Install</b>.</>];
  const computer = !p.ios && !p.macSafari && !p.android;
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-4 sm:items-center" onClick={onClose} role="presentation">
      <div className="block-panel w-full max-w-md bg-ink-2 p-5 text-left" role="dialog" aria-label="How to install" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-xl font-extrabold text-gold">📲 Install the {SITE.name} app</h3>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm">{steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
        {computer && <p className="mt-3 text-xs text-muted">On a school Chromebook, installing may be turned off. If so, bookmark this page instead (<b>Ctrl+D</b>).</p>}
        <p className="mt-3 text-xs text-muted">It gets its own icon, opens full screen, and pages you&apos;ve opened work without internet.</p>
        <button type="button" onClick={onClose} className="btn-block btn-grass mt-4 w-full justify-center">Got it</button>
      </div>
    </div>
  );
}
