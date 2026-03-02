import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";

const API_BASE = "http://localhost:5050/api"; // change if needed

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
      <div className="relative w-full max-w-xl rounded-xl border bg-white shadow-lg">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h3 className="text-base font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-gray-100">
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

export default function WardManagement() {
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastText, setToastText] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [isNew, setIsNew] = useState(true);

  const [form, setForm] = useState({
    id: "",
    ward_name: "",
    bed_count: 0,
    cot_count: 0,
    active: true,
  });

  const showToast = (text) => {
    setToastText(text);
    setToastOpen(true);
  };

  /* ================= FETCH WARDS ================= */
const getAuthHeaders = () => {
  const token = sessionStorage.getItem("token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

const fetchWards = async () => {
  try {
    setLoading(true);

    const token = sessionStorage.getItem("token");
    if (!token) {
      showToast("Please login again.");
      window.location.href = "/login";
      return;
    }

    const res = await fetch(`${API_BASE}/wards`, {
      headers: getAuthHeaders(),
    });

    if (res.status === 401) {
      showToast("Session expired. Please login again.");
      window.location.href = "/login";
      return;
    }

    const data = await res.json();
    setWards(data.wards || []);
  } catch (err) {
    console.error(err);
    showToast("Failed to load wards");
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchWards();
}, []);
  /* ================= CREATE / UPDATE ================= */
  const save = async () => {
    if (!form.ward_name.trim()) {
      showToast("Ward Name is required");
      return;
    }

    try {
      if (isNew) {
        const res = await fetch(`${API_BASE}/wards`, {
  method: "POST",
  headers: getAuthHeaders(),
  body: JSON.stringify({
    ward_name: form.ward_name,
    bed_count: form.bed_count,
    cot_count: form.cot_count,
  }),
});

        if (!res.ok) throw new Error("Create failed");
        showToast("Ward Added");
      } else {
        const res = await fetch(`${API_BASE}/wards/${form.id}`, {
  method: "PUT",
  headers: getAuthHeaders(),
  body: JSON.stringify({
    ward_name: form.ward_name,
    bed_count: form.bed_count,
    cot_count: form.cot_count,
  }),
});

        if (!res.ok) throw new Error("Update failed");
        showToast("Ward Updated");
      }

      setModalOpen(false);
      fetchWards();
    } catch (err) {
      console.error(err);
      showToast("Operation failed");
    }
  };

  /* ================= TOGGLE ================= */
  const toggleActive = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/wards/${id}/toggle`, {
  method: "PATCH",
  headers: getAuthHeaders(),
});

      if (!res.ok) throw new Error("Toggle failed");

      showToast("Ward status changed");
      fetchWards();
    } catch (err) {
      console.error(err);
      showToast("Failed to change status");
    }
  };

  /* ================= DELETE ================= */
  const removeWard = async (id) => {
    const ok = window.confirm("Are you sure you want to delete this ward?");
    if (!ok) return;

    try {
      const res = await fetch(`${API_BASE}/wards/${id}`, {
  method: "DELETE",
  headers: getAuthHeaders(),
});
      if (!res.ok) throw new Error("Delete failed");

      showToast("Ward deleted");
      fetchWards();
    } catch (err) {
      console.error(err);
      showToast("Delete failed");
    }
  };

  const openNew = () => {
    setIsNew(true);
    setForm({ id: "", ward_name: "", bed_count: 0, cot_count: 0, active: true });
    setModalOpen(true);
  };

  const openEdit = (ward) => {
    setIsNew(false);
    setForm({ ...ward });
    setModalOpen(true);
  };

  const onNumber = (value) => {
    const n = parseInt(value, 10);
    return Number.isFinite(n) ? n : 0;
  };

  return (
    <div className="space-y-6">
      <Toast open={toastOpen} text={toastText} onClose={() => setToastOpen(false)} />

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Ward Management</h1>

        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Ward
        </button>
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        <div className="p-4 overflow-x-auto">
          {loading ? (
            <div className="text-center py-10 text-gray-500">Loading...</div>
          ) : (
            <table className="w-full min-w-[750px] border-collapse">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="py-3">Name</th>
                  <th className="py-3 text-right">Beds</th>
                  <th className="py-3 text-right">Cots</th>
                  <th className="py-3 text-right">Total</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Actions</th>
                </tr>
              </thead>

              <tbody className="text-sm">
                {wards.map((w) => {
                  const total = (w.bed_count || 0) + (w.cot_count || 0);

                  return (
                    <tr key={w.id} className="border-t">
                      <td className="py-3 font-medium">{w.ward_name}</td>
                      <td className="py-3 text-right">{w.bed_count}</td>
                      <td className="py-3 text-right">{w.cot_count}</td>
                      <td className="py-3 text-right font-semibold">{total}</td>

                      <td className="py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            w.active
                              ? "bg-blue-50 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {w.active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEdit(w)}
                            className="rounded-md p-2 hover:bg-gray-100"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => toggleActive(w.id)}
                            className="rounded-md p-2 hover:bg-gray-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => removeWard(w.id)}
                            className="rounded-md p-2 hover:bg-red-50 text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {wards.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-gray-500">
                      No wards available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        open={modalOpen}
        title={isNew ? "Add Ward" : "Edit Ward"}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              className="rounded-lg border px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={save}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
            >
              {isNew ? "Add" : "Save"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <div className="text-xs font-medium text-gray-700 mb-1">
              Ward Name
            </div>
            <input
              value={form.ward_name}
              onChange={(e) =>
                setForm((p) => ({ ...p, ward_name: e.target.value }))
              }
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-medium text-gray-700 mb-1">
                Beds
              </div>
              <input
                type="number"
                value={form.bed_count}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    bed_count: onNumber(e.target.value),
                  }))
                }
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>

            <div>
              <div className="text-xs font-medium text-gray-700 mb-1">
                Cots
              </div>
              <input
                type="number"
                value={form.cot_count}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    cot_count: onNumber(e.target.value),
                  }))
                }
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}