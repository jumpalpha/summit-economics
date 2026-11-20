// ── wave-x7b ── shared print rules for the Sub Guide and the Print Quest Sheet:
// white paper, dark ink in both themes, and none of the site chrome (nav, footer, aurora, install button).
export const PRINT_CSS = `
@media print {
  html, html.light { --bg:#fff; --bg-2:#fff; --fg:#111; --muted:#444; --line:rgba(0,0,0,.2); --glass-1:#fff; --glass-2:#fff; --panel:#fff;
    --color-gold:#8a5a00; --color-emerald:#047857; --color-crimson:#b91c1c; --color-sky:#0369a1; --color-amber:#b45309; --color-violet:#6d28d9; }
  html, body { background:#fff !important; color:#111 !important; } :root, html { color-scheme:light !important; }
  header, footer, .no-print, body > div[aria-hidden], [data-pwa-install] { display:none !important; }
  main { padding:0 !important; }
  .grain::after { display:none !important; }
  .block-panel, .glass { backdrop-filter:none !important; box-shadow:none !important; background:#fff !important; }
  * { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  a { color:inherit !important; text-decoration:none !important; }
}`;
