"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit3, Trash2, Globe, Sparkles, Loader2, RefreshCw } from "lucide-react";

type Blog = {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  content_ar: string;
  content_en: string;
  cover_image: string;
  published_at: string;
};

export default function SadminBlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Partial<Blog>>({
    slug: "", title_ar: "", title_en: "", description_ar: "", description_en: "", 
    content_ar: "", content_en: "", cover_image: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/sadmin/blogs");
      if (res.ok) {
        setBlogs(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;
    try {
      const res = await fetch(`/api/sadmin/blogs?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setBlogs(blogs.filter(b => b.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openAddModal = () => {
    setEditingBlog(null);
    setFormData({
      slug: "", title_ar: "", title_en: "", description_ar: "", description_en: "", 
      content_ar: "", content_en: "", cover_image: ""
    });
    setModalOpen(true);
  };

  const openEditModal = (blog: Blog) => {
    setEditingBlog(blog);
    setFormData(blog);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const url = "/api/sadmin/blogs";
      const method = editingBlog ? "PUT" : "POST";
      const payload = editingBlog ? { ...formData, id: editingBlog.id } : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchBlogs();
        setModalOpen(false);
      } else {
        const errData = await res.json();
        alert("Error saving blog: " + errData.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <Globe className="w-8 h-8 text-indigo-400" />
            Content Management
          </h1>
          <p className="text-zinc-400 mt-2 font-medium">Manage and compose public articles for the marketing blog.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchBlogs}
            className="p-2.5 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 text-zinc-300 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-5 h-5" />
            Compose Article
          </button>
        </div>
      </div>

      <div className="bg-[#0f0f11] border border-[#1f1f1f] rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#18181b] border-b border-[#27272a] text-xs uppercase tracking-wider text-zinc-400 font-bold">
                <th className="px-6 py-4">Title (EN / AR)</th>
                <th className="px-6 py-4">URL Slug</th>
                <th className="px-6 py-4">Published At</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f1f]">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-zinc-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                    <p>Loading database sync...</p>
                  </td>
                </tr>
              ) : blogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-zinc-500">
                    <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-50" />
                    <p>No articles found. Ready to seed or compose.</p>
                  </td>
                </tr>
              ) : (
                blogs.map((blog) => (
                  <tr key={blog.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img src={blog.cover_image} alt="" className="w-12 h-12 rounded-lg object-cover border border-zinc-800" />
                        <div>
                          <div className="font-bold text-zinc-100">{blog.title_en}</div>
                          <div className="text-sm font-medium text-zinc-500 arabic">{blog.title_ar}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-300">/blog/{blog.slug}</code>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-400 font-medium whitespace-nowrap">
                      {new Date(blog.published_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => openEditModal(blog)} className="p-2 bg-zinc-800 hover:bg-indigo-500/20 text-zinc-400 hover:text-indigo-400 rounded-lg transition-colors inline-block">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(blog.id)} className="p-2 bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg transition-colors inline-block">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f0f11] border border-[#1f1f1f] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
             <div className="p-6 border-b border-[#1f1f1f] flex items-center justify-between sticky top-0 bg-[#0f0f11]/90 backdrop-blur z-10">
               <h2 className="text-xl font-bold text-white">{editingBlog ? "Edit Article" : "Compose Article"}</h2>
               <button onClick={() => setModalOpen(false)} className="text-zinc-400 hover:text-white px-3 py-1 rounded-lg hover:bg-white/5 transition-colors">Cancel</button>
             </div>
             
             <form onSubmit={handleSubmit} className="p-6 space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-4">
                   <h3 className="text-sm uppercase tracking-wider font-bold text-zinc-500 mb-4 pb-2 border-b border-zinc-800">English Content</h3>
                   <div>
                     <label className="block text-sm font-medium text-zinc-400 mb-1">Title (EN)</label>
                     <input required name="title_en" value={formData.title_en} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-zinc-400 mb-1">Description (EN)</label>
                     <textarea required name="description_en" value={formData.description_en} onChange={handleChange} rows={3} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-zinc-400 mb-1">HTML Content (EN)</label>
                     <textarea required name="content_en" value={formData.content_en} onChange={handleChange} rows={10} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono text-sm" placeholder="<p>Write your HTML content...</p>" />
                   </div>
                 </div>

                 <div className="space-y-4" dir="rtl">
                   <h3 className="text-sm uppercase tracking-wider font-bold text-zinc-500 mb-4 pb-2 border-b border-zinc-800">المحتوى العربي</h3>
                   <div>
                     <label className="block text-sm font-medium text-zinc-400 mb-1">العنوان (AR)</label>
                     <input required name="title_ar" value={formData.title_ar} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-zinc-400 mb-1">الوصف (AR)</label>
                     <textarea required name="description_ar" value={formData.description_ar} onChange={handleChange} rows={3} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-zinc-400 mb-1">المحتوى HTML (AR)</label>
                     <textarea required name="content_ar" value={formData.content_ar} onChange={handleChange} rows={10} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono text-sm" placeholder="<p>اكتب المحتوى هنا...</p>" />
                   </div>
                 </div>
               </div>

               <div className="pt-6 border-t border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className="block text-sm font-medium text-zinc-400 mb-1">URL Slug</label>
                   <input required name="slug" value={formData.slug} onChange={handleChange} placeholder="e.g., our-company-news" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-zinc-400 mb-1">Cover Image URL</label>
                   <input required name="cover_image" type="url" value={formData.cover_image} onChange={handleChange} placeholder="https://..." className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                 </div>
               </div>

               <div className="flex justify-end pt-6">
                 <button disabled={isSubmitting} type="submit" className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50">
                   {isSubmitting ? "Saving..." : "Publish Article"}
                 </button>
               </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
