"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  CreditCard,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

type Stats = {
  total: number;
  paid: number;
  unpaid: number;
  active: number;
  // optional fields (agar backend bermasa ham muammo yo‘q)
  todayNew?: number;
  last7New?: number;
};

function clampPct(n: number) {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    api
      .get("/api/stats/overview")
      .then((res) => {
        if (!mounted) return;
        setStats(res.data);
      })
      .catch(() => {
        if (!mounted) return;
        setStats({ total: 0, paid: 0, unpaid: 0, active: 0 });
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  const total = stats?.total ?? 0;
  const paid = stats?.paid ?? 0;
  const unpaid = stats?.unpaid ?? 0;
  const active = stats?.active ?? 0;

  const paidRate = useMemo(
    () => (total ? (paid / total) * 100 : 0),
    [paid, total],
  );
  const activeRate = useMemo(
    () => (total ? (active / total) * 100 : 0),
    [active, total],
  );

  // Kreativ “health score”
  const healthScore = useMemo(() => {
    // paidRate 60%, activeRate 40%
    const score = paidRate * 0.6 + activeRate * 0.4;
    return Math.round(clampPct(score));
  }, [paidRate, activeRate]);

  const mood = useMemo(() => {
    if (healthScore >= 80)
      return {
        label: "Excellent",
        hint: "Everything looks solid.",
        icon: <Sparkles size={18} />,
      };
    if (healthScore >= 60)
      return {
        label: "Good",
        hint: "Minor improvements possible.",
        icon: <BadgeCheck size={18} />,
      };
    return {
      label: "Needs attention",
      hint: "Focus on unpaid & inactive.",
      icon: <Zap size={18} />,
    };
  }, [healthScore]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-sm muted-text">Mini CRM</div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm muted-text">
            A quick snapshot of your system status
          </p>
        </div>

        <div className="card px-4 py-3 inline-flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl border hairline bg-[rgb(var(--muted))] grid place-items-center text-[rgb(var(--primary))]">
            {mood.icon}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{mood.label}</div>
            <div className="text-xs muted-text truncate">{mood.hint}</div>
          </div>
          <div className="ml-2 text-sm font-semibold">{healthScore}%</div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          loading={loading}
          title="Total clients"
          value={total}
          hint="All records in the system"
          icon={<Users size={18} />}
        />
        <KpiCard
          loading={loading}
          title="Active"
          value={active}
          hint={`${Math.round(clampPct(activeRate))}% active rate`}
          icon={<BadgeCheck size={18} />}
        />
        <KpiCard
          loading={loading}
          title="Paid"
          value={paid}
          hint={`${Math.round(clampPct(paidRate))}% paid rate`}
          icon={<CreditCard size={18} />}
        />
        <KpiCard
          loading={loading}
          title="Unpaid"
          value={unpaid}
          hint="Follow-up recommended"
          icon={<CalendarDays size={18} />}
        />
      </div>

      {/* Analytics row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Progress */}
        <div className="card lg:col-span-2">
          <div className="card-hd flex items-center justify-between">
            <div>
              <div className="font-semibold">Performance overview</div>
              <div className="text-xs muted-text">Paid/Active distribution</div>
            </div>
            <div className="text-xs muted-text inline-flex items-center gap-1">
              <ArrowUpRight size={14} />
              Updated just now
            </div>
          </div>

          <div className="card-bd space-y-5">
            <MetricBar
              loading={loading}
              label="Paid rate"
              value={Math.round(clampPct(paidRate))}
              sub={`${paid} / ${total} clients are paid`}
            />
            <MetricBar
              loading={loading}
              label="Active rate"
              value={Math.round(clampPct(activeRate))}
              sub={`${active} / ${total} clients are active`}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <MiniStat
                loading={loading}
                label="Health score"
                value={`${healthScore}%`}
              />
              <MiniStat
                loading={loading}
                label="Today new"
                value={`${stats?.todayNew ?? 0}`}
              />
              <MiniStat
                loading={loading}
                label="Last 7 days"
                value={`${stats?.last7New ?? 0}`}
              />
            </div>
          </div>
        </div>

        {/* Action suggestions */}
        <div className="card">
          <div className="card-hd">
            <div className="font-semibold">Smart suggestions</div>
            <div className="text-xs muted-text">What to do next</div>
          </div>

          <div className="card-bd space-y-3">
            <Suggestion
              loading={loading}
              title="Call unpaid clients"
              desc="Prioritize unpaid to boost cashflow."
              badge={`${unpaid} unpaid`}
            />
            <Suggestion
              loading={loading}
              title="Re-activate inactive"
              desc="Contact inactive clients with a new offer."
              badge={`${Math.max(0, total - active)} inactive`}
            />
            <Suggestion
              loading={loading}
              title="Clean phone formats"
              desc="Make sure all phones are consistent."
              badge="data quality"
            />

            <div className="pt-2 text-xs muted-text">
              Tip: Clients sahifasida status/payment ustiga bossang tez
              o‘zgaradi.
            </div>
          </div>
        </div>
      </div>

      {/* Footer small strip */}
      <div className="card">
        <div className="card-bd flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">System highlight</div>
            <div className="text-xs muted-text">
              Minimal CRM with auth, filters, pagination, export and inline
              updates.
            </div>
          </div>
          <div className="inline-flex items-center gap-2 text-xs muted-text">
            <span className="inline-flex items-center gap-2 rounded-full border hairline px-3 py-1">
              <span className="h-2 w-2 rounded-full bg-[rgb(var(--success))]" />
              API connected
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border hairline px-3 py-1">
              <span className="h-2 w-2 rounded-full bg-[rgb(var(--primary))]" />
              UI polished
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  hint,
  icon,
  loading,
}: {
  title: string;
  value: number;
  hint: string;
  icon: React.ReactNode;
  loading: boolean;
}) {
  return (
    <div className="card">
      <div className="card-bd">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm muted-text">{title}</div>
            {loading ? (
              <div className="mt-2 h-9 w-24 skeleton" />
            ) : (
              <div className="mt-2 text-3xl font-semibold">{value}</div>
            )}
            <div className="mt-2 text-xs muted-text">{hint}</div>
          </div>

          <div className="h-10 w-10 rounded-2xl border hairline bg-[rgb(var(--muted))] grid place-items-center text-[rgb(var(--primary))]">
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricBar({
  label,
  value,
  sub,
  loading,
}: {
  label: string;
  value: number;
  sub: string;
  loading: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="font-medium">{label}</div>
        {loading ? (
          <div className="h-5 w-14 skeleton" />
        ) : (
          <div className="text-sm font-semibold">{value}%</div>
        )}
      </div>

      <div className="h-3 rounded-full border hairline bg-[rgb(var(--muted))]/60 overflow-hidden">
        <div
          className="h-full rounded-full bg-[rgb(var(--primary))]/70"
          style={{ width: `${clampPct(value)}%` }}
        />
      </div>

      <div className="text-xs muted-text">{sub}</div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  loading,
}: {
  label: string;
  value: string;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl border hairline bg-[rgb(var(--muted))]/30 px-4 py-3">
      <div className="text-xs muted-text">{label}</div>
      {loading ? (
        <div className="mt-2 h-6 w-16 skeleton" />
      ) : (
        <div className="mt-1 text-lg font-semibold">{value}</div>
      )}
    </div>
  );
}

function Suggestion({
  title,
  desc,
  badge,
  loading,
}: {
  title: string;
  desc: string;
  badge: string;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border hairline bg-[rgb(var(--muted))]/30 p-4 space-y-2">
        <div className="h-4 w-40 skeleton" />
        <div className="h-3 w-56 skeleton" />
        <div className="h-6 w-24 skeleton" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border hairline bg-[rgb(var(--muted))]/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium">{title}</div>
          <div className="text-xs muted-text mt-1">{desc}</div>
        </div>
        <span className="chip chip-muted">{badge}</span>
      </div>
    </div>
  );
}
