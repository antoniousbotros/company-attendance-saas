"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, FileText, MoveRight } from "lucide-react";
import { blogData } from "@/lib/blog-data";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";

export default function BlogListPage() {
  const { lang, isRTL } = useLanguage();

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans pb-24">
      {/* Super Simple Header */}
      <header className="bg-white border-b border-[#eeeeee] sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#ff5a00] rounded-xl flex items-center justify-center shadow-lg shadow-[#ff5a00]/20">
              <span className="text-white font-black text-sm">Y</span>
            </div>
            <span className="text-xl font-black tracking-tighter text-[#111]">
              Yawmy {isRTL && "يومي"}
            </span>
          </Link>
          <nav>
            <Link
              href="/"
              className="text-sm font-bold text-[#6b7280] hover:text-[#111] transition-colors"
            >
              {isRTL ? "العودة للرئيسية" : "Back to Home"}
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-24">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16 animate-in slide-in-from-bottom-6 fade-in duration-700">
          <h1 className="text-4xl md:text-5xl font-black text-[#111] tracking-tight">
            {isRTL ? "مدونة يومي" : "Yawmy Blog"}
          </h1>
          <p className="text-lg md:text-xl text-[#6b7280] font-medium leading-relaxed">
            {isRTL
              ? "استكشف أحدث المقالات والرؤى حول إدارة فرق العمل بفعالية وتحسين الإنتاجية باستخدام أدواتنا."
              : "Explore the latest articles and insights on effectively managing teams and improving productivity with our tools."}
          </p>
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {blogData.map((post, i) => (
            <Link
              href={`/blog/${post.slug}`}
              key={post.slug}
              className="group bg-white rounded-3xl border border-[#eeeeee] overflow-hidden hover:border-[#111] hover:shadow-2xl hover:shadow-black/5 transition-all duration-300 flex flex-col"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="aspect-[16/9] w-full overflow-hidden relative bg-[#f5f5f5]">
                <img
                  src={post.coverImage}
                  alt={post.title[lang === "ar" ? "ar" : "en"]}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
              </div>
              
              <div className="p-6 md:p-8 flex flex-col flex-grow">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-[#f0fdf4] text-[#15803d] px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase flex items-center gap-1.5 border border-[#bbf7d0]">
                    <FileText className="w-3 h-3" />
                    ARTICLE
                  </div>
                  <span className="text-[13px] text-[#9ca3af] font-bold">
                    {new Date(post.date).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                
                <h2 className="text-2xl font-black text-[#111] mb-3 group-hover:text-[#ff5a00] transition-colors line-clamp-2">
                  {post.title[lang === "ar" ? "ar" : "en"]}
                </h2>
                
                <p className="text-[#6b7280] font-medium leading-relaxed line-clamp-3 mb-6">
                  {post.description[lang === "ar" ? "ar" : "en"]}
                </p>

                <div className="mt-auto flex items-center text-[#111] font-bold text-sm gap-2">
                  {isRTL ? "اقرأ المقال" : "Read Article"}
                  <MoveRight className={cn("w-4 h-4 group-hover:translate-x-1 transition-transform", isRTL && "rotate-180")} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
