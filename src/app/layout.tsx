import type { Metadata } from "next";
import {
  Poppins as FontSans,
  IBM_Plex_Sans_Arabic as FontArabic,
} from "next/font/google";
import "./globals.css";

// Latin: Poppins — geometric sans for dashboard UI
const fontSans = FontSans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

// Arabic: IBM Plex Sans Arabic — IBM's Arabic sans, pairs cleanly with Poppins
const fontArabic = FontArabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-ibm-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SyncTime | Attendance SaaS",
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
