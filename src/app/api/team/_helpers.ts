import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import crypto from "crypto";

export interface TeamSession {
  employee_id: string;
  company_id: string;
}

// Simple deterministic hash — sufficient for owner-set employee PINs/passwords
export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(`yawmy::${password}`).digest("hex");
}

export async function getTeamSession(req: NextRequest): Promise<TeamSession | null> {
  const token = req.cookies.get("team_session")?.value;
  if (!token) return null;

  const { data } = await supabaseAdmin
    .from("employee_sessions")
    .select("employee_id, company_id, expires_at")
    .eq("token", token)
    .single();

  if (!data) return null;
  if (new Date(data.expires_at) < new Date()) return null;

  return { employee_id: data.employee_id, company_id: data.company_id };
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function matchPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.slice(-9);
}
