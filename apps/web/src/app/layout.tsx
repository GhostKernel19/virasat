import type { Metadata } from "next";
import { Fraunces, Inter, Mukta } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/i18n";
import { FallingLeaves } from "@/components/motion";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const mukta = Mukta({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["devanagari", "latin"],
  variable: "--font-mukta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "विरासत (Virasat) — A Living Heritage Atlas",
  description:
    "A map-first heritage atlas that indexes, structures, and visualizes cultural heritage assets, monuments, records, and oral histories.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} ${mukta.variable}`}
    >
      <body className="bg-sand text-ink font-sans antialiased min-h-screen flex flex-col relative">
        <FallingLeaves />
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
