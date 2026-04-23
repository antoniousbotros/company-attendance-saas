import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifySadminTokenAPI } from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get("sadmin_session");
    const secret = process.env.SADMIN_JWT_SECRET || "";
    if (!sessionCookie || !secret || !(await verifySadminTokenAPI(sessionCookie.value, secret))) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { ownerId } = await req.json();

    if (!ownerId) {
      return NextResponse.json({ ok: false, error: "Missing parameters" }, { status: 400 });
    }

    // 1. Get the user's email
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(ownerId);
    
    if (userError || !user?.email) {
      return NextResponse.json({ ok: false, error: "Could not find user email to impersonate." }, { status: 404 });
    }

    // 2. Generate a magic link for this user
    // This allows the Super Admin to click the link and instantly be logged in as them
    // Redirects to /overview
    const baseUrl = process.env.NODE_ENV === "production" ? "https://yawmy.app" : "http://localhost:3000";
    
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: user.email,
      options: {
        redirectTo: `${baseUrl}/overview`
      }
    });

    if (error) throw error;

    if (data && data.properties && data.properties.action_link) {
      return NextResponse.json({ 
         ok: true, 
         url: data.properties.action_link 
      });
    }

    throw new Error("Action link not generated");

  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
