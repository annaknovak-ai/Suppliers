import type { Metadata, Viewport } from "next";
import { Italiana, Lora } from "next/font/google";
import { AppStateProvider } from "@/src/state/AppStateProvider";
import { Header } from "@/src/ui/Header";
import "./globals.css";

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
});

const italiana = Italiana({
  variable: "--font-italiana",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Supplier Finder",
  description: "Building maintenance supplier search in Ukraine and Moldova",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1B4B2F",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${lora.variable} ${italiana.variable}`}>
      <body>
        <AppStateProvider>
          <Header />
          {children}
        </AppStateProvider>
      </body>
    </html>
  );
}
