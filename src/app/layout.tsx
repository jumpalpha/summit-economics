import type { Metadata, Viewport } from "next";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { MountainScene } from "@/components/mountains";
import { PwaRegister } from "@/components/x7b/pwa";
import { SITE } from "@/data/config";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: `${SITE.fullName}`, template: `%s · ${SITE.name}` },
  description: `${SITE.teacherPossessive} high school economics class: 24 chapters, 8 units, a climb from the trailhead to the summit. Built on the Idaho economics standards.`,
  manifest: "/manifest.webmanifest",
  icons: { icon: [{ url: "/app/icon-32.png", sizes: "32x32", type: "image/png" }, { url: "/app/icon-192.png", sizes: "192x192", type: "image/png" }], apple: "/app/icon-180.png" },
  appleWebApp: { capable: true, title: SITE.name, statusBarStyle: "black-translucent" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0a1018" };

// Runs before paint so there's no flash. Dark (night on the mountain) by default; light only if chosen.
const themeBoot = `try{if(localStorage.getItem('summit_theme')==='light')document.documentElement.classList.add('light')}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body className="grain relative flex min-h-full flex-col overflow-x-hidden">
        <MountainScene />
        <Nav />
        <main className="relative z-10 flex-1">{children}</main>
        <Footer />
        <PwaRegister />
      </body>
    </html>
  );
}
