"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Stats = { total: number; paid: number; unpaid: number; active: number };

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.get("/api/stats/overview").then((res) => setStats(res.data));
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Total" value={stats?.total} />
        <Card title="Paid" value={stats?.paid} />
        <Card title="Unpaid" value={stats?.unpaid} />
        <Card title="Active" value={stats?.active} />
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value?: number }) {
  return (
    <div className="rounded-2xl border p-4">
      <p className="text-sm opacity-70">{title}</p>
      <p className="text-3xl font-semibold">{value ?? "—"}</p>
    </div>
  );
}
