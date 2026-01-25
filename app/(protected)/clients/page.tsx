"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

type Client = {
  id: number;
  fullName: string;
  phone: string;
  course: string;
  status: "active" | "inactive";
  paymentStatus: "paid" | "unpaid";
  createdAt: string;
};

export default function ClientsPage() {
  const [items, setItems] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");

  const [loading, setLoading] = useState(false);
  const pages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total]);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/api/clients", {
        params: {
          q,
          status: status || undefined,
          paymentStatus: paymentStatus || undefined,
          page,
          limit,
        },
      });
      setItems(res.data.items);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, paymentStatus]);

  // q o'zgarsa page=1 qilib, search button bilan load qilamiz
  function onSearch() {
    setPage(1);
    load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Clients</h1>

      {/* Filters */}
      <div className="rounded-2xl border p-4 flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex-1">
          <label className="text-sm opacity-70">Search (name/phone)</label>
          <input
            className="mt-1 w-full rounded-xl border px-3 py-2 bg-transparent"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Masalan: Ali yoki +99890..."
          />
        </div>

        <div className="w-full md:w-44">
          <label className="text-sm opacity-70">Status</label>
          <select
            className="mt-1 w-full rounded-xl border px-3 py-2 bg-transparent"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="w-full md:w-44">
          <label className="text-sm opacity-70">Payment</label>
          <select
            className="mt-1 w-full rounded-xl border px-3 py-2 bg-transparent"
            value={paymentStatus}
            onChange={(e) => {
              setPaymentStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>

        <button
          onClick={onSearch}
          className="rounded-xl border px-4 py-2 hover:bg-white/5"
        >
          Search
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="text-sm opacity-70">
            {loading ? "Loading..." : `Total: ${total}`}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr className="text-left">
                <th className="p-3">Full name</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Course</th>
                <th className="p-3">Status</th>
                <th className="p-3">Payment</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-b last:border-b-0">
                  <td className="p-3 font-medium">{c.fullName}</td>
                  <td className="p-3">{c.phone}</td>
                  <td className="p-3">{c.course}</td>
                  <td className="p-3">{c.status}</td>
                  <td className="p-3">{c.paymentStatus}</td>
                </tr>
              ))}
              {!loading && items.length === 0 && (
                <tr>
                  <td className="p-6 opacity-70" colSpan={5}>
                    No clients found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 flex items-center justify-between">
          <button
            className="rounded-xl border px-3 py-2 hover:bg-white/5 disabled:opacity-40"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </button>
          <div className="text-sm opacity-70">
            Page {page} / {pages}
          </div>
          <button
            className="rounded-xl border px-3 py-2 hover:bg-white/5 disabled:opacity-40"
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
