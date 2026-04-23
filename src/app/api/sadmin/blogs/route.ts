import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { blogData } from "@/lib/blog-data";
import { verifySadminTokenAPI } from "@/lib/security";

// Helper to authenticate sadmin session
const checkAuth = async (req: NextRequest) => {
  const sessionCookie = req.cookies.get("sadmin_session");
  const secret = process.env.SADMIN_JWT_SECRET || "";
  if (!sessionCookie || !secret) return false;
  return await verifySadminTokenAPI(sessionCookie.value, secret);
};

export async function GET(req: NextRequest) {
  if (!(await checkAuth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { data: blogs, error } = await supabaseAdmin
      .from("blog_posts")
      .select("*")
      .order("published_at", { ascending: false });

    // Seed logic if table is newly created and empty
    if (!error && (!blogs || blogs.length === 0)) {
       const mappedData = blogData.map((b) => ({
         slug: b.slug,
         title_ar: b.title.ar,
         title_en: b.title.en,
         description_ar: b.description.ar,
         description_en: b.description.en,
         content_ar: b.content.ar,
         content_en: b.content.en,
         cover_image: b.coverImage,
         published_at: b.date ? new Date(b.date).toISOString() : new Date().toISOString()
       }));

       const { data: seeded, error: seedError } = await supabaseAdmin.from("blog_posts").insert(mappedData).select("*").order("published_at", { ascending: false });
       if (seedError) {
         return NextResponse.json({ error: seedError.message }, { status: 500 });
       }
       return NextResponse.json(seeded);
    }

    if (error) throw error;
    return NextResponse.json(blogs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await checkAuth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { data, error } = await supabaseAdmin.from("blog_posts").insert(body).select().single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!(await checkAuth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { id, ...updates } = body;
    
    if (!id) return NextResponse.json({ error: "Missing article ID" }, { status: 400 });

    const { data, error } = await supabaseAdmin.from("blog_posts").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await checkAuth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) return NextResponse.json({ error: "Missing article ID" }, { status: 400 });

    const { error } = await supabaseAdmin.from("blog_posts").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
