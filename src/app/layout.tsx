import type { Metadata } from "next";
import {
  Poppins as FontSans,
  IBM_Plex_Sans_Arabic as FontArabic,
} from "next/font/google";
import "./globals.css";

import localFont from "next/font/local";

// Latin: Poppins — geometric sans for dashboard UI
const fontSans = FontSans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

// Arabic: Custom Ping Arabic Font
const fontArabic = localFont({
  src: [
    { path: "./fonts/ping-light.woff2", weight: "300", style: "normal" },
    { path: "./fonts/ping-regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ping-medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/ping-bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-ibm-arabic", // keeping the variable name constant to avoid breaking CSS
  display: "swap",
});

export const metadata: Metadata = {
  title: "Yawmy يومي | Attendance SaaS",
  description: "Modern Telegram-based attendance tracking for companies",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="auto"
      className={`${fontSans.variable} ${fontArabic.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        {children}
      </body>
    </html>
  );
}
