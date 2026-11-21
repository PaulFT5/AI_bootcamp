import type { Metadata } from "next";
import { Public_Sans, Red_Hat_Mono } from "next/font/google";
import "./globals.css";

// latin-ext covers Romanian diacritics. Fonts are fetched at build time and self-hosted.
const publicSans = Public_Sans({ variable: "--font-public-sans", subsets: ["latin", "latin-ext"] });
const redHatMono = Red_Hat_Mono({ variable: "--font-red-hat-mono", subsets: ["latin", "latin-ext"], weight: ["500", "600"] });

export const metadata: Metadata = {
  title: "Erasmus@UPT",
  description: "Course matching for incoming Erasmus+ students at Politehnica University of Timișoara",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${publicSans.variable} ${redHatMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
