"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

export default function SadminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/sadmin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (data.ok) {
        // Successful login securely set a cookie by the backend
        router.push("/sadmin");
      } else {
        setError(data.error || "Invalid Password");
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="w-8 h-8" />
        </div>
        
        <h1 className="text-2xl font-bold text-center text-white mb-2">God Mode Access</h1>
        <p className="text-zinc-400 text-center mb-8">Enter the Super Admin passphrase to continue.</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-white outline-none"
              placeholder="Passphrase"
              required
            />
          </div>

          {error && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm text-center font-medium">{error}</div>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-3 rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Authorize Access"}
          </button>
        </form>
      </div>
    </div>
  );
}
