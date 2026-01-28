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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
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

  // search
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");

  // filters/sort
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [course, setCourse] = useState("");
  const [sort, setSort] = useState<
    "createdAt" | "fullName" | "paymentStatus" | "status"
  >("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  // UI controls
  const [filtersOpen, setFiltersOpen] = useState(false); // dropdown style
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // selection
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // modal
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // drawer
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

  const rangeText = useMemo(() => {
    if (total === 0) return "0–0";
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);
    return `${start}–${end}`;
  }, [page, limit, total]);

  // debounce search
  useEffect(() => {
    const t = window.setTimeout(() => setQ(qInput.trim()), 300);
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
      const msg = e?.response?.data?.message || "Load error";
      setError(msg);
      toast.error(msg);
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
    setPage(1);
    clearSelection();
    toast.info("Reset ✅");
  }

  function toggleSort(
    next: "createdAt" | "fullName" | "paymentStatus" | "status",
  ) {
    if (sort === next) {
      setOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSort(next);
      setOrder(next === "fullName" ? "asc" : "desc");
    }
    setPage(1);
  }

  function SortIcon({ col }: { col: typeof sort }) {
    const active = sort === col;
    if (!active)
      return (
        <ArrowUpDown
          size={14}
          className="opacity-60 transition-opacity duration-200"
        />
      );
    return order === "asc" ? (
      <ArrowUp
        size={14}
        className="opacity-90 transition-opacity duration-200"
      />
    ) : (
      <ArrowDown
        size={14}
        className="opacity-90 transition-opacity duration-200"
      />
    );
  }

  const toolbarMeta = (
    <div className="text-xs muted-text">
      {loading
        ? "Loading..."
        : `Showing ${rangeText} of ${total} • Page ${page}/${pages}`}
      {error && (
        <span className="ml-2 text-[rgb(var(--danger))]">• {error}</span>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
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
              <button onClick={clearSelection} className="btn smooth">
                <X size={16} /> Clear
              </button>
              <button onClick={bulkDelete} className="btn btn-danger smooth">
                <Trash2 size={16} /> Delete selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clients list card: toolbar + filters dropdown inside same card */}
      <div className="card overflow-hidden">
        {/* Toolbar row: Search left of Export/Add; meta left above table (as requested) */}
        <div className="card-hd">
          <div className="flex flex-col gap-3">
            {/* top toolbar */}
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between w-full">
                {/* left: search + export/add aligned */}
                <div className="flex items-center gap-2 w-full">
                  {/* Search (left of export/add) */}
                  <div className="relative w-full max-w-[520px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--subtext))]">
                      <Search size={16} />
                    </span>
                    <input
                      className="input pl-9"
                      value={qInput}
                      onChange={(e) => setQInput(e.target.value)}
                      placeholder="Search by name/phone…"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") setQ(qInput.trim());
                      }}
                    />
                  </div>

                  <button
                    onClick={() => load({ resetPage: true })}
                    className="btn btn-primary smooth"
                  >
                    Search
                  </button>

                  {/* Export + Add on the RIGHT SIDE of search (same row) */}
                  <div className="hidden md:flex items-center gap-2 ml-auto">
                    <button onClick={exportCsv} className="btn smooth">
                      <Download size={16} /> Export CSV
                    </button>
                    <button
                      onClick={openCreate}
                      className="btn btn-primary smooth"
                    >
                      <Plus size={16} /> Add client
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* meta line (LEFT above table) */}
            <div className="flex items-center justify-between gap-3">
              {toolbarMeta}

              <div className="flex items-center gap-2">
                <button className="btn smooth" onClick={resetAll}>
                  <RefreshCw size={16} /> Reset
                </button>

                <button
                  className="btn smooth"
                  onClick={() => setFiltersOpen((v) => !v)}
                  title="Filters"
                >
                  <Filter size={16} />
                  Filters
                  <span className="ml-1 inline-flex items-center opacity-80">
                    {filtersOpen ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters dropdown area (same card) */}
        <div
          className={[
            "border-t hairline",
            "transition-all duration-200 ease-out",
            filtersOpen
              ? "opacity-100 max-h-[220px]"
              : "opacity-0 max-h-0 overflow-hidden",
          ].join(" ")}
        >
          <div className="card-bd">
            {/* Single row, no wrap -> horizontal scroll */}
            <div className="flex gap-3 items-end overflow-x-auto pb-1">
              <div className="min-w-[160px]">
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

              <div className="min-w-[170px]">
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

              <div className="min-w-[220px]">
                <label className="text-sm muted-text">Course</label>
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

              <div className="min-w-[170px]">
                <label className="text-sm muted-text">Sort</label>
                <select
                  className="select mt-1"
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value as any);
                    setPage(1);
                  }}
                >
                  <option value="createdAt">createdAt</option>
                  <option value="fullName">fullName</option>
                  <option value="status">status</option>
                  <option value="paymentStatus">paymentStatus</option>
                </select>
              </div>

              <div className="min-w-[140px]">
                <label className="text-sm muted-text">Order</label>
                <select
                  className="select mt-1"
                  value={order}
                  onChange={(e) => {
                    setOrder(e.target.value as any);
                    setPage(1);
                  }}
                >
                  <option value="desc">desc</option>
                  <option value="asc">asc</option>
                </select>
              </div>
            </div>
          </div>

          {/* small arrow control (requested) */}
          <div className="px-5 pb-4">
            <button
              className="btn w-full justify-center smooth"
              onClick={() => setFiltersOpen(false)}
              title="Close filters"
            >
              <ChevronUp size={18} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="table table-fixed">
            <thead className="border-b hairline">
              <tr>
                <th className="th w-[56px]">
                  <button
                    className="btn px-2 py-1 smooth"
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

                <th className="th w-[320px]">
                  <SortableTh
                    label="Client"
                    active={sort === "fullName"}
                    onClick={() => toggleSort("fullName")}
                  >
                    <SortIcon col="fullName" />
                  </SortableTh>
                </th>

                <th className="th w-[220px]">Course</th>

                {/* Combined column: status + payment */}
                <th className="th w-[200px]">
                  <div className="inline-flex items-center gap-2">
                    <span className="font-medium text-[rgb(var(--subtext))]">
                      State
                    </span>
                  </div>
                </th>

                <th className="th w-[220px]">
                  <SortableTh
                    label="Created"
                    active={sort === "createdAt"}
                    onClick={() => toggleSort("createdAt")}
                  >
                    <SortIcon col="createdAt" />
                  </SortableTh>
                </th>

                <th className="th w-[200px]">Actions</th>
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
                      <div className="h-4 w-[260px] skeleton" />
                      <div className="h-3 w-[180px] skeleton mt-2" />
                    </td>
                    <td className="td">
                      <div className="h-4 w-[160px] skeleton" />
                    </td>
                    <td className="td">
                      <div className="h-7 w-[170px] skeleton" />
                    </td>
                    <td className="td">
                      <div className="h-4 w-[170px] skeleton" />
                    </td>
                    <td className="td">
                      <div className="h-9 w-[150px] skeleton" />
                    </td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td
                    className="p-10 text-center text-sm muted-text"
                    colSpan={6}
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
                          className="btn px-2 py-1 smooth"
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
                        <div className="td-truncate font-medium">
                          {c.fullName}
                        </div>
                        <div className="td-truncate text-xs muted-text">
                          {c.phone}
                        </div>
                      </td>

                      <td className="td">
                        <div className="td-truncate">{c.course}</div>
                      </td>

                      {/* Combined state cell */}
                      <td className="td">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between gap-2">
                            <StatusPill
                              kind={c.status}
                              onClick={() => toggleField(c.id, "status")}
                              compact
                            />
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <PaymentPill
                              kind={c.paymentStatus}
                              onClick={() => toggleField(c.id, "paymentStatus")}
                              compact
                            />
                          </div>
                        </div>
                      </td>

                      <td className="td">
                        <div className="td-truncate text-xs muted-text">
                          {fmtDate(c.createdAt)}
                        </div>
                      </td>

                      {/* Actions: details icon only, edit icon+text, delete icon only */}
                      <td className="td">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setDrawerId(c.id)}
                            className="btn smooth px-3"
                            title="Details"
                            aria-label="Details"
                          >
                            <Info size={16} />
                          </button>

                          <button
                            onClick={() => openEdit(c)}
                            className="btn smooth px-3"
                            title="Edit"
                          >
                            <Pencil size={16} />
                            <span className="hidden sm:inline">Edit</span>
                          </button>

                          <button
                            onClick={() => remove(c.id)}
                            className="btn btn-danger smooth px-3"
                            title="Delete"
                            aria-label="Delete"
                          >
                            <Trash2 size={16} />
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

        {/* Bottom controls row: Page size left, Prev/Next right */}
        <div className="card-hd flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm muted-text">Page size</span>
            <select
              className="select w-[110px]"
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

            <span className="text-xs muted-text">
              • Showing {rangeText} of {total}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="btn smooth"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <button
              className="btn smooth"
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Drawer */}
      {drawerClient && (
        <div
          className="modal-backdrop fade-in"
          onMouseDown={() => setDrawerId(null)}
        >
          <div
            className="modal max-w-xl pop-in"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="card-hd flex items-center justify-between">
              <div>
                <div className="font-semibold">Client details</div>
                <div className="text-xs muted-text">ID: {drawerClient.id}</div>
              </div>
              <button className="btn smooth" onClick={() => setDrawerId(null)}>
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
                  className="btn smooth"
                  onClick={() => {
                    setDrawerId(null);
                    openEdit(drawerClient);
                  }}
                >
                  <Pencil size={16} /> Edit
                </button>
                <button
                  className="btn btn-danger smooth"
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
        <div
          className="modal-backdrop fade-in"
          onMouseDown={() => setOpen(false)}
        >
          <div
            className="modal pop-in"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="card-hd flex items-center justify-between">
              <div>
                <div className="font-semibold">
                  {mode === "create" ? "Add client" : "Edit client"}
                </div>
                <div className="text-xs muted-text">Fill details carefully</div>
              </div>
              <button onClick={() => setOpen(false)} className="btn smooth">
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
                <button onClick={() => setOpen(false)} className="btn smooth">
                  Cancel
                </button>
                <button
                  disabled={saving}
                  onClick={save}
                  className="btn btn-primary smooth"
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

function SortableTh({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 rounded-lg px-2 py-1",
        "transition-all duration-200 ease-out hover:bg-[rgb(var(--muted))]/60",
        active ? "text-[rgb(var(--text))]" : "text-[rgb(var(--subtext))]",
      ].join(" ")}
      title="Sort"
    >
      <span className="font-medium">{label}</span>
      <span className="transition-transform duration-200 ease-out">
        {children}
      </span>
    </button>
  );
}

function StatusPill({
  kind,
  onClick,
  compact,
}: {
  kind: "active" | "inactive";
  onClick: () => void;
  compact?: boolean;
}) {
  const active = kind === "active";
  return (
    <button
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 rounded-full border text-xs font-semibold",
        compact ? "px-2.5 py-1" : "px-3 py-1.5",
        "transition-all duration-200 ease-out hover:brightness-[1.03]",
        "active:scale-[0.98] active:translate-y-[1px]",
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
  compact,
}: {
  kind: "paid" | "unpaid";
  onClick: () => void;
  compact?: boolean;
}) {
  const paid = kind === "paid";
  return (
    <button
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 rounded-full border text-xs font-semibold",
        compact ? "px-2.5 py-1" : "px-3 py-1.5",
        "transition-all duration-200 ease-out hover:brightness-[1.03]",
        "active:scale-[0.98] active:translate-y-[1px]",
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
    <div className="rounded-2xl border hairline bg-[rgb(var(--muted))]/30 px-4 py-3 transition-colors duration-200 ease-out">
      <div className="text-xs muted-text">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}
