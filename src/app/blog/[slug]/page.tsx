"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, Share2, Facebook, Twitter, Linkedin } from "lucide-react";
import { blogData } from "@/lib/blog-data";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";

export default function BlogPostPage() {
  const { lang, isRTL } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const post = useMemo(() => blogData.find((p) => p.slug === slug), [slug]);

  if (!post) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-black text-[#111] mb-4">404</h1>
        <p className="text-[#6b7280] font-bold mb-8">
          {isRTL ? "لم يتم العثور على المقال." : "Article not found."}
        </p>
        <button
          onClick={() => router.push("/blog")}
          className="bg-[#111] text-white px-8 py-3.5 rounded-xl font-bold hover:bg-black transition-colors"
        >
          {isRTL ? "العودة للمدونة" : "Back to Blog"}
        </button>
      </div>
    );
  }

  const title = post.title[lang === "ar" ? "ar" : "en"];
  const content = post.content[lang === "ar" ? "ar" : "en"];

  const [currentUrl, setCurrentUrl] = React.useState("");

  React.useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title,
        url: currentUrl,
      }).catch(console.error);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans">
      {/* Super Simple Header */}
      <header className="bg-white border-b border-[#eeeeee] sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#ff5a00] rounded-xl flex items-center justify-center shadow-lg shadow-[#ff5a00]/20">
              <span className="text-white font-black text-sm">Y</span>
            </div>
            <span className="text-xl font-black tracking-tighter text-[#111] hidden sm:block">
              Yawmy {isRTL && "يومي"}
            </span>
          </Link>
          <nav>
            <Link
              href="/blog"
              className="text-sm font-bold text-[#6b7280] flex items-center gap-2 hover:text-[#111] transition-colors bg-[#f5f5f5] px-4 py-2 rounded-xl"
            >
              {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              {isRTL ? "كل المقالات" : "All Articles"}
            </Link>
          </nav>
        </div>
      </header>

      <article className="pb-32">
        {/* Cover Section */}
        <div className="w-full h-[400px] md:h-[550px] relative bg-[#111]">
          <img
            src={post.coverImage}
            alt={title}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 max-w-[900px] mx-auto z-10 animate-in slide-in-from-bottom-8 fade-in duration-700">
            <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm font-bold mb-6">
              <span className="bg-[#ff5a00] text-white px-3 py-1 rounded-full text-xs uppercase tracking-wider">
                Article
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {new Date(post.date).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-4">
              {title}
            </h1>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-[800px] mx-auto px-4 md:px-8 mt-16 md:mt-24 flex flex-col md:flex-row gap-12 relative items-start">
          
          {/* Social Share Sidebar (Sticky Desktop) */}
          <div className="md:w-16 shrink-0 flex flex-row md:flex-col gap-4 md:sticky md:top-32">
            <button 
              onClick={handleShare}
              title={isRTL ? "مشاركة" : "Share"}
              className="w-12 h-12 rounded-full border border-[#e5e7eb] flex items-center justify-center text-[#6b7280] hover:text-[#111] hover:border-[#111] hover:bg-[#f9fafb] transition-all bg-white"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <a 
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(currentUrl)}`}
              target="_blank" rel="noreferrer"
              title="Twitter"
              className="w-12 h-12 rounded-full border border-[#e5e7eb] flex items-center justify-center text-[#6b7280] hover:text-[#1da1f2] hover:border-[#1da1f2] transition-all bg-white"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a 
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`}
              target="_blank" rel="noreferrer"
              title="LinkedIn"
              className="w-12 h-12 rounded-full border border-[#e5e7eb] flex items-center justify-center text-[#6b7280] hover:text-[#0a66c2] hover:border-[#0a66c2] transition-all bg-white"
            >
              <Linkedin className="w-5 h-5" />
            </a>
            <a 
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
              target="_blank" rel="noreferrer"
              title="Facebook"
              className="w-12 h-12 rounded-full border border-[#e5e7eb] flex items-center justify-center text-[#6b7280] hover:text-[#1877f2] hover:border-[#1877f2] transition-all bg-white"
            >
              <Facebook className="w-5 h-5" />
            </a>
          </div>

          {/* Article Body */}
          <div className="flex-1 min-w-0 prose prose-lg md:prose-xl prose-p:text-[#4b5563] prose-p:leading-relaxed prose-headings:text-[#111] prose-headings:font-black prose-a:text-[#ff5a00] prose-img:rounded-3xl max-w-none">
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        </div>
      </article>
    </div>
  );
}
