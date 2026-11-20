"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [light, setLight] = useState(false);
  useEffect(() => setLight(document.documentElement.classList.contains("light")), []);
  const flip = () => {
    const next = !light;
    document.documentElement.classList.toggle("light", next);
    try { localStorage.setItem("summit_theme", next ? "light" : "dark"); } catch {}
    setLight(next);
  };
  return (
    <button onClick={flip} aria-label={light ? "Switch to dark mode" : "Switch to light mode"} title={light ? "Dark mode" : "Light mode"}
      className="grid size-9 place-items-center rounded-xl text-muted transition hover:bg-white/5 hover:text-fg">
      {light ? <Moon className="size-[18px]" /> : <Sun className="size-[18px]" />}
    </button>
  );
}
