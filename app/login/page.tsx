"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post("/api/auth/login", { username, password });
      localStorage.setItem("token", res.data.token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Login error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md card">
        <div className="card-hd">
          <div className="text-xl font-semibold">Mini CRM Login</div>
          <div className="text-sm text-[rgb(var(--subtext))]">
            Sign in to continue
          </div>
        </div>

        <form onSubmit={onSubmit} className="card-bd space-y-4">
          <div className="space-y-1">
            <label className="text-sm text-[rgb(var(--subtext))]">
              Username
            </label>
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-[rgb(var(--subtext))]">
              Password
            </label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="text-sm text-[rgb(var(--danger))]">{error}</div>
          )}

          <button disabled={loading} className="btn btn-primary w-full">
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <div className="text-xs text-[rgb(var(--subtext))]">
            Demo: <span className="font-medium">admin / admin123</span>
          </div>
        </form>
      </div>
    </div>
  );
}
