import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import crypto from "crypto";

export interface TeamSession {
  employee_id: string;
  company_id: string;
}

// LEGACY: Old simple SHA-256 hash (Vulnerable to offline cracking; kept for migration only)
export function hashPasswordLegacy(password: string): string {
  return crypto.createHash("sha256").update(`yawmy::${password}`).digest("hex");
}

// V1: Modern Memory-Hard Scrypt Hashing with Unique Salts
export function hashPasswordV1(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  // Scrypt configuration: N=16384 (cost), r=8 (block size), p=1 (parallelization)
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `v1:${salt}:${hash}`;
}

// Universal Verifier: Checks both new secure hashes and transparently catches old legacy hashes
export function verifyPassword(password: string, dbHash: string): boolean {
  if (!dbHash) return false;
  
  if (dbHash.startsWith("v1:")) {
    const [, salt, originalHash] = dbHash.split(":");
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    return hash === originalHash;
  }
  
  // Fallback to legacy
  return hashPasswordLegacy(password) === dbHash;
}

// ========== NATIVE ZERO-DEPENDENCY JWT ENGINE ==========
function getJwtSecret() {
  return process.env.JWT_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "yawmy_default_fallback_secret_key";
}

function base64UrlEncode(str: string) {
  return Buffer.from(str).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string) {
  let decoded = str.replace(/-/g, "+").replace(/_/g, "/");
  while (decoded.length % 4) decoded += "=";
  return Buffer.from(decoded, "base64").toString("utf-8");
}

export function generateJWT(payload: any): string {
  const header = { alg: "HS256", typ: "JWT" };
  const head64 = base64UrlEncode(JSON.stringify(header));
  const pay64 = base64UrlEncode(JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }));
  const signature = crypto.createHmac("sha256", getJwtSecret()).update(`${head64}.${pay64}`).digest("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${head64}.${pay64}.${signature}`;
}

export function verifyJWT(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [h, p, s] = parts;
    const signature = crypto.createHmac("sha256", getJwtSecret()).update(`${h}.${p}`).digest("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    if (signature !== s) return null;
    const payload = JSON.parse(base64UrlDecode(p));
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getTeamSession(req: NextRequest): Promise<TeamSession | null> {
  const token = req.cookies.get("team_session")?.value;
  if (!token) return null;

  // FAST PATH: Stateless Edge-Verified JWT (0ms Latency)
  if (token.includes(".")) {
    const payload = verifyJWT(token);
    if (payload && payload.employee_id && payload.company_id) {
      return { employee_id: payload.employee_id, company_id: payload.company_id };
    }
    return null;
  }

  // LEGACY PATH: Blocking database query for old hex sessions (Backward Compatibility)
  const { data } = await supabaseAdmin
    .from("employee_sessions")
    .select("employee_id, company_id, expires_at")
    .eq("token", token)
    .single();

  if (!data) return null;
  if (new Date(data.expires_at) < new Date()) return null;

  return { employee_id: data.employee_id, company_id: data.company_id };
}

// Kept for telegram tokens/internal systems
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
