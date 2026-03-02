import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";

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
      <div className="relative w-full max-w-xl rounded-xl border bg-white shadow-lg">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h3 className="text-base font-semibold">{title}</h3>
          <button onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        <div className="flex justify-end gap-2 border-t px-5 py-4">
          {footer}
        </div>
      </div>
    </div>
  );
}

export default function DietPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [isNew, setIsNew] = useState(true);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastText, setToastText] = useState("");

  const [form, setForm] = useState({
    id: "",
    name: "",
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

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/diet-plans`, {
        headers: getHeaders(),
      });

      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }

      const data = await res.json();
      setPlans(data.plans || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to load diet plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const save = async () => {
    if (!form.name.trim()) {
      showToast("Name is required");
      return;
    }

    try {
      if (isNew) {
        await fetch(`${API_BASE}/diet-plans`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(form),
        });
        showToast("Diet Plan Added");
      } else {
        await fetch(`${API_BASE}/diet-plans/${form.id}`, {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify(form),
        });
        showToast("Diet Plan Updated");
      }

      setModalOpen(false);
      fetchPlans();
    } catch (err) {
      console.error(err);
      showToast("Operation failed");
    }
  };

  const toggleActive = async (id) => {
    await fetch(`${API_BASE}/diet-plans/${id}/toggle`, {
      method: "PATCH",
      headers: getHeaders(),
    });
    fetchPlans();
  };

  const removePlan = async (id) => {
    if (!window.confirm("Delete this diet plan?")) return;

    await fetch(`${API_BASE}/diet-plans/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });

    fetchPlans();
  };

  const openNew = () => {
    setIsNew(true);
    setForm({ id: "", name: "", display_order: plans.length + 1, active: true });
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setIsNew(false);
    setForm(p);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <Toast open={toastOpen} text={toastText} onClose={() => setToastOpen(false)} />

      <div className="flex justify-between">
        <h1 className="text-xl font-bold">Diet Plan Management</h1>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          <Plus className="h-4 w-4" />
          Add Diet Plan
        </button>
      </div>

      <div className="rounded-xl border bg-white shadow-sm p-4">
        {loading ? (
          <div>Loading...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-500">
                <th>Name</th>
                <th className="text-right">Order</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.id} className="border-t">
                  <td>{p.name}</td>
                  <td className="text-right">{p.display_order}</td>
                  <td>
                    <span className={p.active ? "text-blue-600" : "text-gray-500"}>
                      {p.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="flex gap-2">
                    <button onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => toggleActive(p.id)}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => removePlan(p.id)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={modalOpen}
        title={isNew ? "Add Diet Plan" : "Edit Diet Plan"}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button onClick={() => setModalOpen(false)}>Cancel</button>
            <button onClick={save} className="bg-blue-600 text-white px-3 py-1 rounded">
              Save
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <input
            placeholder="Diet Plan Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border px-3 py-2 rounded"
          />
          <input
            type="number"
            value={form.display_order}
            onChange={(e) =>
              setForm({ ...form, display_order: parseInt(e.target.value) || 1 })
            }
            className="w-full border px-3 py-2 rounded"
          />
        </div>
      </Modal>
    </div>
  );
}