import type { Metadata } from "next";
import { Poppins as FontSans, Cairo as FontArabic } from "next/font/google";
import "./globals.css";

const fontSans = FontSans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

const fontArabic = FontArabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-cairo",
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
