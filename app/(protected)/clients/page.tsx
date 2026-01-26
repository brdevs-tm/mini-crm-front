"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "react-toastify";
import {
  Plus,
  Search,
  RefreshCw,
  Trash2,
  Pencil,
  Download,
  X,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  Info,
} from "lucide-react";

type Client = {
  id: number;
  fullName: string;
  phone: string;
  course: string;
  status: "active" | "inactive";
  paymentStatus: "paid" | "unpaid";
  createdAt: string;
};

type FormState = {
  fullName: string;
  phone: string;
  course: string;
  status: "active" | "inactive";
  paymentStatus: "paid" | "unpaid";
};

const emptyForm: FormState = {
  fullName: "",
  phone: "",
  course: "",
  status: "active",
  paymentStatus: "unpaid",
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function onlyDigitsPhone(s: string) {
  const trimmed = s.trim();
  if (!trimmed) return "";
  const plus = trimmed.startsWith("+") ? "+" : "";
  const digits = trimmed.replace(/\D/g, "");
  return plus + digits;
}

export default function ClientsPage() {
  const [items, setItems] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [course, setCourse] = useState("");
  const [sort, setSort] = useState<
    "createdAt" | "fullName" | "paymentStatus" | "status"
  >("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [selected, setSelected] = useState<Set<number>>(new Set());

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [drawerId, setDrawerId] = useState<number | null>(null);
  const drawerClient = useMemo(
    () => items.find((x) => x.id === drawerId) ?? null,
    [items, drawerId],
  );

  const pages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit],
  );
  const reqIdRef = useRef(0);

  useEffect(() => {
    const t = window.setTimeout(() => setQ(qInput.trim()), 350);
    return () => window.clearTimeout(t);
  }, [qInput]);

  function clearSelection() {
    setSelected(new Set());
  }

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllOnPage() {
    setSelected((prev) => {
      const next = new Set(prev);
      items.forEach((c) => next.add(c.id));
      return next;
    });
  }
  function unselectAllOnPage() {
    setSelected((prev) => {
      const next = new Set(prev);
      items.forEach((c) => next.delete(c.id));
      return next;
    });
  }

  const allSelectedOnPage = useMemo(() => {
    if (items.length === 0) return false;
    return items.every((c) => selected.has(c.id));
  }, [items, selected]);

  const anySelectedOnPage = useMemo(
    () => items.some((c) => selected.has(c.id)),
    [items, selected],
  );

  async function load(opts?: { resetPage?: boolean }) {
    const myReq = ++reqIdRef.current;
    const nextPage = opts?.resetPage ? 1 : page;
    if (opts?.resetPage) setPage(1);

    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/clients", {
        params: {
          q: q || undefined,
          status: status || undefined,
          paymentStatus: paymentStatus || undefined,
          course: course || undefined,
          page: nextPage,
          limit,
          sort,
          order,
        },
      });

      if (myReq !== reqIdRef.current) return;

      setItems(res.data.items);
      setTotal(res.data.total);

      setSelected((prev) => {
        const next = new Set<number>();
        const ids = new Set(res.data.items.map((x: Client) => x.id));
        prev.forEach((id) => ids.has(id) && next.add(id));
        return next;
      });
    } catch (e: any) {
      setError(e?.response?.data?.message || "Load error");
      toast.error("Load error");
    } finally {
      if (myReq === reqIdRef.current) setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, status, paymentStatus, course, sort, order, q]);

  function openCreate() {
    setMode("create");
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setOpen(true);
  }

  function openEdit(c: Client) {
    setMode("edit");
    setEditingId(c.id);
    setForm({
      fullName: c.fullName,
      phone: c.phone,
      course: c.course,
      status: c.status,
      paymentStatus: c.paymentStatus,
    });
    setFormError(null);
    setOpen(true);
  }

  function validateForm(s: FormState) {
    if (!s.fullName.trim()) return "Full name majburiy";
    if (!s.phone.trim()) return "Phone majburiy";
    if (!s.course.trim()) return "Course majburiy";

    const normalized = onlyDigitsPhone(s.phone);
    const digits = normalized.replace(/\D/g, "");
    if (digits.length < 9) return "Phone juda qisqa";
    return null;
  }

  async function save() {
    const err = validateForm(form);
    if (err) {
      setFormError(err);
      toast.error(err);
      return;
    }

    const payload = { ...form, phone: onlyDigitsPhone(form.phone) };

    setSaving(true);
    setFormError(null);
    try {
      if (mode === "create") {
        await api.post("/api/clients", payload);
        toast.success("Client qo‘shildi ✅");
      } else {
        await api.put(`/api/clients/${editingId}`, payload);
        toast.success("Client yangilandi ✅");
      }
      setOpen(false);
      await load();
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Save error";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    const ok = confirm("O‘chirishni tasdiqlaysizmi?");
    if (!ok) return;

    try {
      await api.delete(`/api/clients/${id}`);
      toast.info("O‘chirildi 🗑️");
      await load();
    } catch {
      toast.error("Delete error");
    }
  }

  async function bulkDelete() {
    if (selected.size === 0) return;
    const ok = confirm(`${selected.size} ta client o‘chsinmi?`);
    if (!ok) return;

    const ids = Array.from(selected);
    try {
      await Promise.all(ids.map((id) => api.delete(`/api/clients/${id}`)));
      toast.info(`${ids.length} ta o‘chirildi 🗑️`);
      clearSelection();
      await load();
    } catch {
      toast.error("Bulk delete error");
    }
  }

  async function toggleField(id: number, field: "paymentStatus" | "status") {
    const prev = items;

    // optimistic update
    setItems((arr) =>
      arr.map((c) => {
        if (c.id !== id) return c;
        if (field === "paymentStatus") {
          return {
            ...c,
            paymentStatus: c.paymentStatus === "paid" ? "unpaid" : "paid",
          };
        }
        return { ...c, status: c.status === "active" ? "inactive" : "active" };
      }),
    );

    try {
      await api.patch(`/api/clients/${id}/toggle`, { field });
      toast.success("Updated ✅");
    } catch {
      setItems(prev);
      toast.error("Toggle error");
    }
  }

  async function exportCsv() {
    const token = localStorage.getItem("token");
    if (!token) return toast.error("No token");

    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (paymentStatus) params.set("paymentStatus", paymentStatus);
    if (course) params.set("course", course);
    params.set("sort", sort);
    params.set("order", order);

    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/clients/export/csv?${params.toString()}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return toast.error("Export error");

    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "clients.csv";
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("CSV downloaded ✅");
  }

  function resetAll() {
    setQInput("");
    setQ("");
    setStatus("");
    setPaymentStatus("");
    setCourse("");
    setSort("createdAt");
    setOrder("desc");
    setLimit(10);
    setPage(1);
    clearSelection();
    toast.info("Reset ✅");
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clients</h1>
          <p className="text-sm muted-text">
            Search, filter, bulk actions, export, inline updates
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={exportCsv} className="btn">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={openCreate} className="btn btn-primary">
            <Plus size={16} /> Add client
          </button>
        </div>
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="card">
          <div className="card-bd flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm">
              <span className="font-semibold">{selected.size}</span> selected
              <span className="text-xs muted-text ml-2">
                Bulk actions apply to selected IDs
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={clearSelection} className="btn">
                <X size={16} /> Clear
              </button>
              <button onClick={bulkDelete} className="btn btn-danger">
                <Trash2 size={16} /> Delete selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="card-hd flex items-center justify-between">
          <div className="inline-flex items-center gap-2 font-semibold">
            <Filter size={16} /> Filters & controls
          </div>
          <button className="btn" onClick={() => setFiltersOpen((v) => !v)}>
            {filtersOpen ? "Hide" : "Show"}
          </button>
        </div>

        {filtersOpen && (
          <div className="card-bd grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-5">
              <label className="text-sm muted-text">Search (name/phone)</label>
              <div className="mt-1 flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--subtext))]">
                    <Search size={16} />
                  </span>
                  <input
                    className="input pl-9"
                    value={qInput}
                    onChange={(e) => setQInput(e.target.value)}
                    placeholder="Masalan: Aziz yoki +998901234567"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setQ(qInput.trim());
                    }}
                  />
                </div>

                <button
                  onClick={() => load({ resetPage: true })}
                  className="btn btn-primary"
                >
                  Search
                </button>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm muted-text">Status</label>
              <select
                className="select mt-1"
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

            <div className="md:col-span-2">
              <label className="text-sm muted-text">Payment</label>
              <select
                className="select mt-1"
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

            <div className="md:col-span-3">
              <label className="text-sm muted-text">Course (contains)</label>
              <input
                className="input mt-1"
                value={course}
                onChange={(e) => {
                  setCourse(e.target.value);
                  setPage(1);
                }}
                placeholder="Masalan: Frontend"
              />
            </div>

            <div className="md:col-span-3">
              <label className="text-sm muted-text">Sort by</label>
              <select
                className="select mt-1"
                value={sort}
                onChange={(e) => setSort(e.target.value as any)}
              >
                <option value="createdAt">createdAt</option>
                <option value="fullName">fullName</option>
                <option value="status">status</option>
                <option value="paymentStatus">paymentStatus</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm muted-text">Order</label>
              <select
                className="select mt-1"
                value={order}
                onChange={(e) => setOrder(e.target.value as any)}
              >
                <option value="desc">desc</option>
                <option value="asc">asc</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm muted-text">Page size</label>
              <select
                className="select mt-1"
                value={String(limit)}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>

            <div className="md:col-span-5 flex items-end justify-between gap-2">
              <div className="text-xs muted-text">
                {loading
                  ? "Loading..."
                  : `Total: ${total} • Page ${page}/${Math.max(1, Math.ceil(total / limit))}`}
                {error && (
                  <span className="ml-2 text-[rgb(var(--danger))]">
                    • {error}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button onClick={resetAll} className="btn">
                  <RefreshCw size={16} /> Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="card-hd flex items-center justify-between">
          <div className="text-sm muted-text">
            Showing {total === 0 ? 0 : (page - 1) * limit + 1}-
            {Math.min(page * limit, total)} of {total}
          </div>

          <div className="flex items-center gap-2">
            <button
              className="btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <button
              className="btn"
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table">
            <thead className="border-b hairline">
              <tr>
                <th className="th w-[56px]">
                  <button
                    className="btn px-2 py-1"
                    onClick={() =>
                      allSelectedOnPage
                        ? unselectAllOnPage()
                        : selectAllOnPage()
                    }
                    title={
                      allSelectedOnPage
                        ? "Unselect all on this page"
                        : "Select all on this page"
                    }
                  >
                    {allSelectedOnPage ? (
                      <CheckSquare size={16} />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                </th>
                <th className="th">Client</th>
                <th className="th">Course</th>
                <th className="th">Status</th>
                <th className="th">Payment</th>
                <th className="th">Created</th>
                <th className="th w-[230px]">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading && items.length === 0 ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="tr">
                    <td className="td">
                      <div className="h-8 w-8 skeleton" />
                    </td>
                    <td className="td">
                      <div className="h-4 w-56 skeleton" />
                      <div className="h-3 w-40 skeleton mt-2" />
                    </td>
                    <td className="td">
                      <div className="h-4 w-28 skeleton" />
                    </td>
                    <td className="td">
                      <div className="h-7 w-24 skeleton" />
                    </td>
                    <td className="td">
                      <div className="h-7 w-24 skeleton" />
                    </td>
                    <td className="td">
                      <div className="h-4 w-40 skeleton" />
                    </td>
                    <td className="td">
                      <div className="h-9 w-44 skeleton" />
                    </td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td
                    className="p-10 text-center text-sm muted-text"
                    colSpan={7}
                  >
                    No clients found. Try changing filters.
                  </td>
                </tr>
              ) : (
                items.map((c) => {
                  const isSel = selected.has(c.id);
                  return (
                    <tr key={c.id} className="tr">
                      <td className="td">
                        <button
                          className="btn px-2 py-1"
                          onClick={() => toggleSelect(c.id)}
                          title="Select"
                        >
                          {isSel ? (
                            <CheckSquare size={16} />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </td>

                      <td className="td">
                        <div className="font-medium">{c.fullName}</div>
                        <div className="text-xs muted-text">{c.phone}</div>
                      </td>

                      <td className="td">{c.course}</td>

                      {/* FIXED CHIP DESIGN */}
                      <td className="td">
                        <StatusPill
                          kind={c.status}
                          onClick={() => toggleField(c.id, "status")}
                        />
                      </td>

                      <td className="td">
                        <PaymentPill
                          kind={c.paymentStatus}
                          onClick={() => toggleField(c.id, "paymentStatus")}
                        />
                      </td>

                      <td className="td text-xs muted-text">
                        {fmtDate(c.createdAt)}
                      </td>

                      <td className="td">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setDrawerId(c.id)}
                            className="btn"
                            title="Details"
                          >
                            <Info size={16} /> Details
                          </button>
                          <button
                            onClick={() => openEdit(c)}
                            className="btn"
                            title="Edit"
                          >
                            <Pencil size={16} /> Edit
                          </button>
                          <button
                            onClick={() => remove(c.id)}
                            className="btn btn-danger"
                            title="Delete"
                          >
                            <Trash2 size={16} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="card-hd flex items-center justify-between">
          <div className="text-xs muted-text">
            Selected on page: {anySelectedOnPage ? "Yes" : "No"} • Total
            selected: {selected.size}
          </div>
          <div className="text-xs muted-text">
            Tip: Enter bosib qidirish mumkin
          </div>
        </div>
      </div>

      {/* Drawer */}
      {drawerClient && (
        <div className="modal-backdrop" onMouseDown={() => setDrawerId(null)}>
          <div
            className="modal max-w-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="card-hd flex items-center justify-between">
              <div>
                <div className="font-semibold">Client details</div>
                <div className="text-xs muted-text">ID: {drawerClient.id}</div>
              </div>
              <button className="btn" onClick={() => setDrawerId(null)}>
                ✕
              </button>
            </div>

            <div className="card-bd space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoRow label="Full name" value={drawerClient.fullName} />
                <InfoRow label="Phone" value={drawerClient.phone} />
                <InfoRow label="Course" value={drawerClient.course} />
                <InfoRow label="Status" value={drawerClient.status} />
                <InfoRow label="Payment" value={drawerClient.paymentStatus} />
                <InfoRow
                  label="Created at"
                  value={fmtDate(drawerClient.createdAt)}
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  className="btn"
                  onClick={() => {
                    setDrawerId(null);
                    openEdit(drawerClient);
                  }}
                >
                  <Pencil size={16} /> Edit
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => remove(drawerClient.id)}
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {open && (
        <div className="modal-backdrop" onMouseDown={() => setOpen(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="card-hd flex items-center justify-between">
              <div>
                <div className="font-semibold">
                  {mode === "create" ? "Add client" : "Edit client"}
                </div>
                <div className="text-xs muted-text">Fill details carefully</div>
              </div>
              <button onClick={() => setOpen(false)} className="btn">
                ✕
              </button>
            </div>

            <div className="card-bd space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Full name">
                  <input
                    className="input"
                    value={form.fullName}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, fullName: e.target.value }))
                    }
                  />
                </Field>

                <Field label="Phone">
                  <input
                    className="input"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, phone: e.target.value }))
                    }
                    onBlur={() =>
                      setForm((s) => ({
                        ...s,
                        phone: onlyDigitsPhone(s.phone),
                      }))
                    }
                    placeholder="+998901234567"
                  />
                </Field>

                <Field label="Course">
                  <input
                    className="input"
                    value={form.course}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, course: e.target.value }))
                    }
                  />
                </Field>

                <Field label="Status">
                  <select
                    className="select"
                    value={form.status}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, status: e.target.value as any }))
                    }
                  >
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </select>
                </Field>

                <Field label="Payment status">
                  <select
                    className="select"
                    value={form.paymentStatus}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        paymentStatus: e.target.value as any,
                      }))
                    }
                  >
                    <option value="paid">paid</option>
                    <option value="unpaid">unpaid</option>
                  </select>
                </Field>
              </div>

              {formError && (
                <div className="text-sm text-[rgb(var(--danger))]">
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button onClick={() => setOpen(false)} className="btn">
                  Cancel
                </button>
                <button
                  disabled={saving}
                  onClick={save}
                  className="btn btn-primary"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** ✅ NEW: Clean pill chips (no nested chip) */
function StatusPill({
  kind,
  onClick,
}: {
  kind: "active" | "inactive";
  onClick: () => void;
}) {
  const active = kind === "active";
  return (
    <button
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary))]/45",
        active
          ? "border-[rgb(var(--success))]/45 bg-[rgb(var(--success))]/10 text-[rgb(var(--success))]"
          : "border-[rgb(var(--border))]/70 bg-[rgb(var(--muted))]/40 text-[rgb(var(--subtext))]",
      ].join(" ")}
      title="Click to toggle"
    >
      <span
        className={[
          "h-2 w-2 rounded-full",
          active ? "bg-[rgb(var(--success))]" : "bg-[rgb(var(--subtext))]/60",
        ].join(" ")}
      />
      {kind}
    </button>
  );
}

function PaymentPill({
  kind,
  onClick,
}: {
  kind: "paid" | "unpaid";
  onClick: () => void;
}) {
  const paid = kind === "paid";
  return (
    <button
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary))]/45",
        paid
          ? "border-[rgb(var(--success))]/45 bg-[rgb(var(--success))]/10 text-[rgb(var(--success))]"
          : "border-[rgb(var(--warning))]/45 bg-[rgb(var(--warning))]/10 text-[rgb(var(--warning))]",
      ].join(" ")}
      title="Click to toggle"
    >
      <span
        className={[
          "h-2 w-2 rounded-full",
          paid ? "bg-[rgb(var(--success))]" : "bg-[rgb(var(--warning))]",
        ].join(" ")}
      />
      {kind}
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm muted-text">{label}</label>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border hairline bg-[rgb(var(--muted))]/30 px-4 py-3">
      <div className="text-xs muted-text">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}
