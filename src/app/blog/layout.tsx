"use client";

import React from "react";
import { LanguageProvider } from "@/lib/LanguageContext";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}
