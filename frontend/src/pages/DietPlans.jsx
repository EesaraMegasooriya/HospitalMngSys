import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, RefreshCcw, ToggleLeft, ToggleRight } from "lucide-react";

const API_BASE = "http://localhost:5050/api";

/* ---------------- Toast ---------------- */
function Toast({ open, text, onClose }) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="rounded-lg border bg-white shadow px-4 py-3 text-sm">
        {text}
      </div>
    </div>
  );
}

/* ---------------- Modal ---------------- */
function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-xl border bg-white shadow-lg">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h3 className="text-base font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-4">{children}</div>

        <div className="flex items-center justify-end gap-2 border-t px-5 py-4">
          {footer}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Small helpers ---------------- */
function Pill({ active }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
        active ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-600"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export default function DietPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastText, setToastText] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [isNew, setIsNew] = useState(true);

  const [form, setForm] = useState({
    id: "",
    code: "",
    name: "",
    age_range: "All",
    plan_type: "Patient",
    display_order: 1,
    active: true,
  });

  const showToast = (text) => {
    setToastText(text);
    setToastOpen(true);
  };

  const getHeaders = () => {
    const token = sessionStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const handle401 = () => {
    showToast("Session expired. Please login again.");
    window.location.href = "/login";
  };

  const safeJson = async (res) => {
    try {
      return await res.json();
    } catch {
      return null;
    }
  };

  /* ================= FETCH ================= */
  const fetchPlans = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/diet-plans`, {
        headers: getHeaders(),
      });

      if (res.status === 401) return handle401();
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await safeJson(res);
      setPlans(data?.plans || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to load diet plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ================= CREATE / UPDATE ================= */
  const save = async () => {
    const code = String(form.code || "").trim();
    const name = String(form.name || "").trim();

    if (!code) return showToast("Code is required");
    if (!name) return showToast("Name is required");

    const payload = {
      code,
      name,
      age_range: form.age_range || "All",
      plan_type: form.plan_type || "Patient",
      display_order: Number(form.display_order) || 1,
      // active should be handled by backend default on create (or allow it if you want)
      active: !!form.active,
    };

    try {
      if (isNew) {
        const res = await fetch(`${API_BASE}/diet-plans`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(payload),
        });

        if (res.status === 401) return handle401();
        if (!res.ok) throw new Error("Create failed");

        showToast("Diet Plan Added");
      } else {
        const res = await fetch(`${API_BASE}/diet-plans/${form.id}`, {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify(payload),
        });

        if (res.status === 401) return handle401();
        if (!res.ok) throw new Error("Update failed");

        showToast("Diet Plan Updated");
      }

      setModalOpen(false);
      fetchPlans();
    } catch (err) {
      console.error(err);
      showToast("Operation failed");
    }
  };

  /* ================= TOGGLE ACTIVE ================= */
  const toggleActive = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/diet-plans/${id}/toggle`, {
        method: "PATCH",
        headers: getHeaders(),
      });

      if (res.status === 401) return handle401();
      if (!res.ok) throw new Error("Toggle failed");

      showToast("Diet plan status changed");
      fetchPlans();
    } catch (err) {
      console.error(err);
      showToast("Failed to change status");
    }
  };

  /* ================= DELETE ================= */
  const removePlan = async (id) => {
    const ok = window.confirm("Are you sure you want to delete this diet plan?");
    if (!ok) return;

    try {
      const res = await fetch(`${API_BASE}/diet-plans/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });

      if (res.status === 401) return handle401();
      if (!res.ok) throw new Error("Delete failed");

      showToast("Diet plan deleted");
      fetchPlans();
    } catch (err) {
      console.error(err);
      showToast("Delete failed");
    }
  };

  /* ================= UI actions ================= */
  const openNew = () => {
    setIsNew(true);
    setForm({
      id: "",
      code: "",
      name: "",
      age_range: "All",
      plan_type: "Patient",
      display_order: (plans?.length || 0) + 1,
      active: true,
    });
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setIsNew(false);
    setForm({
      id: p.id,
      code: p.code || "",
      name: p.name || "",
      age_range: p.age_range || "All",
      plan_type: p.plan_type || "Patient",
      display_order: Number(p.display_order) || 1,
      active: !!p.active,
    });
    setModalOpen(true);
  };

  const onNumber = (value) => {
    const n = parseInt(value, 10);
    return Number.isFinite(n) ? n : 1;
  };

  return (
    <div className="space-y-6">
      <Toast open={toastOpen} text={toastText} onClose={() => setToastOpen(false)} />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Diet Plan Management</h1>
          <p className="text-sm text-gray-500">
            Create and manage diet plans used in meal scheduling.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchPlans}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            title="Refresh"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>

          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Diet Plan
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white shadow-sm">
        <div className="p-4 overflow-x-auto">
          {loading ? (
            <div className="text-center py-10 text-gray-500">Loading...</div>
          ) : (
            <table className="w-full min-w-[950px] border-collapse">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="py-3">Code</th>
                  <th className="py-3">Name</th>
                  <th className="py-3">Age Range</th>
                  <th className="py-3">Type</th>
                  <th className="py-3 text-right">Order</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Actions</th>
                </tr>
              </thead>

              <tbody className="text-sm">
                {plans.map((p) => (
                  <tr key={p.id} className={`border-t ${!p.active ? "opacity-70" : ""}`}>
                    <td className="py-3 font-medium">{p.code}</td>
                    <td className="py-3">{p.name}</td>
                    <td className="py-3">{p.age_range || "All"}</td>
                    <td className="py-3">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                        {p.plan_type || "Patient"}
                      </span>
                    </td>
                    <td className="py-3 text-right">{p.display_order}</td>
                    <td className="py-3">
                      <Pill active={!!p.active} />
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          className="rounded-md p-2 hover:bg-gray-100"
                          aria-label="Edit"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => toggleActive(p.id)}
                          className="rounded-md p-2 hover:bg-gray-100"
                          aria-label="Toggle Active"
                          title={p.active ? "Deactivate" : "Activate"}
                        >
                          {p.active ? (
                            <ToggleRight className="h-4 w-4" />
                          ) : (
                            <ToggleLeft className="h-4 w-4" />
                          )}
                        </button>

                        <button
                          onClick={() => removePlan(p.id)}
                          className="rounded-md p-2 hover:bg-red-50 text-red-600"
                          aria-label="Delete"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {plans.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-gray-500">
                      No diet plans available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal
        open={modalOpen}
        title={isNew ? "Add Diet Plan" : "Edit Diet Plan"}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={save}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {isNew ? "Add" : "Save"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Code + Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-medium text-gray-700 mb-1">Code</div>
              <input
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="e.g., DT001"
                disabled={!isNew} // keep code fixed after creation
              />
            </div>

            <div>
              <div className="text-xs font-medium text-gray-700 mb-1">Name</div>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="e.g., Diabetic Diet"
              />
            </div>
          </div>

          {/* Age Range + Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-medium text-gray-700 mb-1">Age Range</div>
              <select
                value={form.age_range}
                onChange={(e) => setForm((p) => ({ ...p, age_range: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="All">All</option>
                <option value="Adult">Adult</option>
                <option value="Child">Child</option>
                <option value="Elder">Elder</option>
              </select>
            </div>

            <div>
              <div className="text-xs font-medium text-gray-700 mb-1">Plan Type</div>
              <select
                value={form.plan_type}
                onChange={(e) => setForm((p) => ({ ...p, plan_type: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="Patient">Patient</option>
                <option value="Staff">Staff</option>
                <option value="Visitor">Visitor</option>
              </select>
            </div>
          </div>

          {/* Display order */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-medium text-gray-700 mb-1">Display Order</div>
              <input
                type="number"
                value={form.display_order}
                onChange={(e) => setForm((p) => ({ ...p, display_order: onNumber(e.target.value) }))}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                min={1}
              />
            </div>

            {!isNew && (
              <div className="flex items-center gap-2 pt-6">
                <input
                  id="active"
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
                />
                <label htmlFor="active" className="text-sm text-gray-700">
                  Active
                </label>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}