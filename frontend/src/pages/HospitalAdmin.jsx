import React, { useMemo, useState, useEffect, useCallback } from "react";
import axios from "axios";

/* ─────────────────────────── helpers ─────────────────────────── */
function decodeJwt(token) {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");
    return JSON.parse(atob(padded));
  } catch { return null; }
}

function getToken() {
  return sessionStorage.getItem("token") || localStorage.getItem("token") || "";
}

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

const API = "http://localhost:5050/api";

/* ─────────────────────────── tiny UI ─────────────────────────── */
function Button({ children, variant = "primary", size = "sm", className = "", ...props }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed";
  const sizes = { sm: "px-3 py-2 text-sm", md: "px-4 py-2.5 text-sm", lg: "px-5 py-3 text-base" };
  const variants = {
    primary:   "bg-[#1E3A8A] text-white hover:bg-[#1e3580]",
    success:   "bg-emerald-600 text-white hover:bg-emerald-700",
    danger:    "bg-red-600 text-white hover:bg-red-700",
    outline:   "border border-[#cbd5e1] bg-white text-[#1E3A8A] hover:bg-[#f0f4ff]",
    ghost:     "bg-transparent text-[#1E3A8A] hover:bg-[#f0f4ff]",
    secondary: "bg-[#f0f4ff] text-[#1E3A8A] hover:bg-[#dce5fb]",
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] ${className}`}
      {...props}
    />
  );
}

function Select({ value, onChange, options = [], placeholder = "Select...", className = "" }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className={`w-full rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] ${className}`}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ children, sub }) {
  return (
    <div className="mb-4">
      <h3 className="text-base font-bold text-[#1E3A8A]">{children}</h3>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function Modal({ open, onClose, title, children, wide = false }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className={`w-full ${wide ? "max-w-2xl" : "max-w-md"} rounded-xl bg-white shadow-xl`}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-bold text-[#1E3A8A]">{title}</h3>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100">✕</button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function Toast({ toasts }) {
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold shadow-lg animate-fade-in
            ${t.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" :
              t.type === "error" ? "bg-red-50 border-red-200 text-red-800" :
              "bg-blue-50 border-blue-200 text-blue-800"}`}
        >
          {t.type === "success" ? "✅" : t.type === "error" ? "❌" : "ℹ️"} {t.msg}
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);
  return { toasts, push };
}

function Badge({ label, color = "blue" }) {
  const colors = {
    blue:   "bg-blue-100 text-blue-700 border-blue-200",
    green:  "bg-emerald-100 text-emerald-700 border-emerald-200",
    red:    "bg-red-100 text-red-700 border-red-200",
    yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
    gray:   "bg-slate-100 text-slate-600 border-slate-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${colors[color]}`}>
      {label}
    </span>
  );
}

function SimpleTable({ headers = [], children, compact = false }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#e2e8f0]">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-[#f8fafc]">
          <tr>
            {headers.map((h) => (
              <th key={h} className={`${compact ? "px-3 py-2" : "px-4 py-3"} text-left font-bold text-[#1E3A8A] whitespace-nowrap`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-10">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1E3A8A]/20 border-t-[#1E3A8A]" />
    </div>
  );
}

function ErrorBox({ msg }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {msg}
    </div>
  );
}

/* ═══════════════════ WARD CONFIG ═══════════════════ */
const EMPTY_WARD = { ward_name: "", bed_count: "", cot_count: "", icu_count: "" };

function WardConfig({ toast }) {
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null); // null = add, ward = edit
  const [form, setForm] = useState(EMPTY_WARD);
  const [saving, setSaving] = useState(false);

  const fetchWards = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await axios.get(`${API}/wards`, { headers: authHeaders() });
      setWards(res.data?.wards || res.data || []);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to fetch wards");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchWards(); }, [fetchWards]);

  const openAdd = () => { setEditing(null); setForm(EMPTY_WARD); setModal(true); };
  const openEdit = (w) => { setEditing(w); setForm({ ward_name: w.ward_name, bed_count: w.bed_count, cot_count: w.cot_count, icu_count: w.icu_count }); setModal(true); };

  const handleSave = async () => {
    if (!form.ward_name.trim()) { toast.push("Ward name is required", "error"); return; }
    setSaving(true);
    try {
      if (editing) {
        await axios.put(`${API}/wards/${editing.id}`, form, { headers: authHeaders() });
        toast.push(`Ward "${form.ward_name}" updated`);
      } else {
        await axios.post(`${API}/wards`, form, { headers: authHeaders() });
        toast.push(`Ward "${form.ward_name}" created`);
      }
      setModal(false);
      fetchWards();
    } catch (e) {
      toast.push(e.response?.data?.message || "Save failed", "error");
    } finally { setSaving(false); }
  };

  const totalCapacity = (w) => (Number(w.bed_count) || 0) + (Number(w.cot_count) || 0) + (Number(w.icu_count) || 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionTitle sub="Add and manage hospital wards">🏥 Ward Configuration</SectionTitle>
        <Button onClick={openAdd}>➕ Add Ward</Button>
      </div>

      {loading && <Spinner />}
      {error && <ErrorBox msg={error} />}

      {!loading && !error && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {wards.map((w) => (
            <div key={w.id} className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-[#1E3A8A]">{w.ward_name}</p>
                  <Badge label={`Capacity: ${totalCapacity(w)}`} color="blue" />
                </div>
                <Button variant="ghost" size="sm" onClick={() => openEdit(w)}>✏️</Button>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                {[["Beds", w.bed_count], ["Cots", w.cot_count], ["ICU", w.icu_count]].map(([label, val]) => (
                  <div key={label} className="rounded-lg border border-[#e2e8f0] bg-white py-2">
                    <p className="font-bold text-[#1E3A8A]">{val || 0}</p>
                    <p className="text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {wards.length === 0 && (
            <div className="col-span-3 rounded-xl border border-dashed border-[#e2e8f0] py-10 text-center text-sm text-slate-400">
              No wards configured yet. Click "Add Ward" to begin.
            </div>
          )}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit Ward" : "Add Ward"}>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Ward Name *</label>
            <Input value={form.ward_name} onChange={(e) => setForm((p) => ({ ...p, ward_name: e.target.value }))} placeholder="e.g. Medical Ward A" />
          </div>
          {[["bed_count", "Bed Count"], ["cot_count", "Cot Count"], ["icu_count", "ICU Count"]].map(([key, label]) => (
            <div key={key}>
              <label className="mb-1 block text-xs font-semibold text-slate-600">{label}</label>
              <Input type="number" min="0" value={form[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))} placeholder="0" />
            </div>
          ))}
          <div className="rounded-lg bg-[#f0f4ff] px-3 py-2 text-sm font-semibold text-[#1E3A8A]">
            Total Capacity: {(Number(form.bed_count) || 0) + (Number(form.cot_count) || 0) + (Number(form.icu_count) || 0)}
          </div>
          <Button className="w-full" size="md" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : editing ? "Update Ward" : "Create Ward"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

/* ═══════════════════ DIET TYPES & MEAL CYCLES ═══════════════════ */
const DIET_TYPES = ["Normal", "Diabetic", "S1", "S2", "S3", "S4", "S5", "HPD"];
const MEAL_CYCLES = ["Veg", "Egg", "Meat", "Fish", "Dried Fish"];

function DietConfig({ toast }) {
  const [activeDiets, setActiveDiets] = useState({});
  const [activeCycles, setActiveCycles] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/diet-config`, { headers: authHeaders() });
        const data = res.data?.config || res.data || {};
        setActiveDiets(data.active_diets || {});
        setActiveCycles(data.active_cycles || {});
      } catch {
        // default all on if endpoint missing
        const d = {}; DIET_TYPES.forEach((t) => (d[t] = true));
        const c = {}; MEAL_CYCLES.forEach((t) => (c[t] = true));
        setActiveDiets(d); setActiveCycles(c);
      } finally { setLoading(false); }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post(`${API}/diet-config`, { active_diets: activeDiets, active_cycles: activeCycles }, { headers: authHeaders() });
      toast.push("Diet configuration saved");
    } catch (e) {
      toast.push(e.response?.data?.message || "Save failed", "error");
    } finally { setSaving(false); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <SectionTitle sub="Enable/disable diet types and meal rotation cycles">🥗 Diet Types & Meal Cycles</SectionTitle>

      <Card>
        <p className="mb-3 text-sm font-semibold text-slate-700">Active Diet Types</p>
        <div className="flex flex-wrap gap-3">
          {DIET_TYPES.map((d) => (
            <label key={d} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition
              ${activeDiets[d] ? "border-[#1E3A8A] bg-[#f0f4ff] text-[#1E3A8A]" : "border-[#e2e8f0] bg-white text-slate-500"}`}
            >
              <input
                type="checkbox"
                checked={!!activeDiets[d]}
                onChange={(e) => setActiveDiets((p) => ({ ...p, [d]: e.target.checked }))}
                className="accent-[#1E3A8A]"
              />
              {d}
            </label>
          ))}
        </div>
      </Card>

      <Card>
        <p className="mb-3 text-sm font-semibold text-slate-700">Meal Cycle Rotation</p>
        <div className="flex flex-wrap gap-3">
          {MEAL_CYCLES.map((c) => (
            <label key={c} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition
              ${activeCycles[c] ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-[#e2e8f0] bg-white text-slate-500"}`}
            >
              <input
                type="checkbox"
                checked={!!activeCycles[c]}
                onChange={(e) => setActiveCycles((p) => ({ ...p, [c]: e.target.checked }))}
                className="accent-emerald-600"
              />
              {c}
            </label>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button size="md" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "💾 Save Diet Configuration"}
        </Button>
      </div>
    </div>
  );
}

/* ═══════════════════ NORM WEIGHT FORMULA EDITOR ═══════════════════ */
const MEALS = ["Breakfast", "Lunch", "Dinner"];

function NormWeightEditor({ toast }) {
  const [diets, setDiets] = useState(["Normal", "Diabetic", "S1", "S2", "S3", "S4", "S5", "HPD"]);
  const [selectedDiet, setSelectedDiet] = useState("Normal");
  const [ingredients, setIngredients] = useState([]);
  const [grid, setGrid] = useState({}); // { [ingredient_id]: { Breakfast: val, Lunch: val, Dinner: val } }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newIngredient, setNewIngredient] = useState("");
  const [addingIng, setAddingIng] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ingRes, normRes] = await Promise.all([
        axios.get(`${API}/ingredients`, { headers: authHeaders() }),
        axios.get(`${API}/norm-weights?diet=${selectedDiet}`, { headers: authHeaders() }),
      ]);
      const ings = ingRes.data?.ingredients || ingRes.data || [];
      setIngredients(ings);
      const norms = normRes.data?.norms || normRes.data || [];
      const built = {};
      ings.forEach((i) => {
        built[i.id] = { Breakfast: "", Lunch: "", Dinner: "" };
      });
      norms.forEach((n) => {
        if (built[n.ingredient_id]) {
          built[n.ingredient_id][n.meal] = n.grams;
        }
      });
      setGrid(built);
    } catch {
      // demo fallback
      const demo = [
        { id: 1, name: "Raw Nadu Rice" }, { id: 2, name: "Dal" },
        { id: 3, name: "Chicken" }, { id: 4, name: "Coconut Oil" },
        { id: 5, name: "Salt" },
      ];
      setIngredients(demo);
      const built = {};
      demo.forEach((i) => { built[i.id] = { Breakfast: "", Lunch: "", Dinner: "" }; });
      setGrid(built);
    } finally { setLoading(false); }
  }, [selectedDiet]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCell = (ingId, meal, val) => {
    setGrid((p) => ({ ...p, [ingId]: { ...p[ingId], [meal]: val } }));
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = [];
    ingredients.forEach((i) => {
      MEALS.forEach((m) => {
        const v = grid[i.id]?.[m];
        if (v !== "" && v !== undefined) {
          payload.push({ ingredient_id: i.id, diet: selectedDiet, meal: m, grams: Number(v) });
        }
      });
    });
    try {
      await axios.post(`${API}/norm-weights`, { norms: payload }, { headers: authHeaders() });
      toast.push(`Norm weights saved for ${selectedDiet}`);
    } catch (e) {
      toast.push(e.response?.data?.message || "Save failed", "error");
    } finally { setSaving(false); }
  };

  const handleAddIngredient = async () => {
    if (!newIngredient.trim()) return;
    setAddingIng(true);
    try {
      const res = await axios.post(`${API}/ingredients`, { name: newIngredient.trim() }, { headers: authHeaders() });
      const newIng = res.data?.ingredient || { id: Date.now(), name: newIngredient.trim() };
      setIngredients((p) => [...p, newIng]);
      setGrid((p) => ({ ...p, [newIng.id]: { Breakfast: "", Lunch: "", Dinner: "" } }));
      setNewIngredient("");
      toast.push(`Ingredient "${newIng.name}" added`);
    } catch (e) {
      toast.push(e.response?.data?.message || "Add failed", "error");
    } finally { setAddingIng(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SectionTitle sub="Set grams per meal per diet type">⚖️ Norm Weight Formula Editor</SectionTitle>
        <div className="w-48">
          <Select
            value={selectedDiet}
            onChange={setSelectedDiet}
            options={diets.map((d) => ({ value: d, label: d }))}
            placeholder="Select Diet"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Add new ingredient..."
          value={newIngredient}
          onChange={(e) => setNewIngredient(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleAddIngredient(); }}
          className="max-w-xs"
        />
        <Button variant="secondary" onClick={handleAddIngredient} disabled={addingIng}>
          {addingIng ? "Adding…" : "➕ Add"}
        </Button>
      </div>

      {loading ? <Spinner /> : (
        <div className="overflow-x-auto rounded-xl border border-[#e2e8f0]">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-[#f0f4ff]">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-[#1E3A8A] min-w-[180px]">Ingredient</th>
                {MEALS.map((m) => (
                  <th key={m} className="px-4 py-3 text-center font-bold text-[#1E3A8A]">
                    {m} <span className="font-normal text-slate-400">(g)</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ingredients.map((ing, idx) => (
                <tr key={ing.id} className={idx % 2 === 0 ? "bg-white" : "bg-[#fafbfc]"}>
                  <td className="px-4 py-2 font-medium text-slate-700">{ing.name}</td>
                  {MEALS.map((m) => (
                    <td key={m} className="px-2 py-2 text-center">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={grid[ing.id]?.[m] ?? ""}
                        onChange={(e) => handleCell(ing.id, m, e.target.value)}
                        className="w-20 rounded-lg border border-[#e2e8f0] bg-white px-2 py-1.5 text-center text-sm outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/10"
                        placeholder="0"
                      />
                    </td>
                  ))}
                </tr>
              ))}
              {ingredients.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-sm text-slate-400">No ingredients yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-end">
        <Button size="md" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : `💾 Save ${selectedDiet} Norms`}
        </Button>
      </div>
    </div>
  );
}

/* ═══════════════════ FRACTIONAL FORMULA EDITOR ═══════════════════ */
const DEFAULT_DIET_KEYS = ["Normal", "Diabetic", "S1", "S2", "S3", "S4", "S5", "HPD", "Staff"];

function FractionalEditor({ toast }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ ingredient: "", fractions: {} });

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/fractional-formulas`, { headers: authHeaders() });
      setItems(res.data?.formulas || res.data || []);
    } catch {
      setItems([
        { id: 1, ingredient: "Coconut", fractions: { Normal: 5, Staff: 10, S1: 6 } },
        { id: 2, ingredient: "Sugar",   fractions: { Normal: 10, Diabetic: 0 } },
      ]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openAdd = () => {
    setEditItem(null);
    setForm({ ingredient: "", fractions: {} });
    setModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ ingredient: item.ingredient, fractions: { ...item.fractions } });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.ingredient.trim()) { toast.push("Ingredient name required", "error"); return; }
    setSaving(true);
    try {
      if (editItem) {
        await axios.put(`${API}/fractional-formulas/${editItem.id}`, form, { headers: authHeaders() });
        toast.push(`Formula for "${form.ingredient}" updated`);
      } else {
        await axios.post(`${API}/fractional-formulas`, form, { headers: authHeaders() });
        toast.push(`Formula for "${form.ingredient}" created`);
      }
      setModal(false);
      fetchItems();
    } catch (e) {
      toast.push(e.response?.data?.message || "Save failed", "error");
    } finally { setSaving(false); }
  };

  const formulaStr = (fractions) => {
    return Object.entries(fractions)
      .filter(([, v]) => v !== "" && v !== undefined && Number(v) !== 0)
      .map(([k, v]) => `${k}/${v}`)
      .join(" + ") || "—";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionTitle sub="Define per-diet fractional quantities (e.g. Coconut = Normal/5 + Staff/10)">🔢 Fractional Formula Editor</SectionTitle>
        <Button onClick={openAdd}>➕ Add Formula</Button>
      </div>

      {loading ? <Spinner /> : (
        <SimpleTable headers={["Ingredient", "Formula", "Actions"]}>
          {items.map((item) => (
            <tr key={item.id} className="bg-white">
              <td className="px-4 py-3 font-semibold text-[#1E3A8A]">{item.ingredient}</td>
              <td className="px-4 py-3 font-mono text-xs text-slate-600">{formulaStr(item.fractions)}</td>
              <td className="px-4 py-3">
                <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>✏️ Edit</Button>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan={3} className="py-8 text-center text-sm text-slate-400">No formulas defined yet.</td></tr>
          )}
        </SimpleTable>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editItem ? "Edit Formula" : "Add Formula"} wide>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Ingredient *</label>
            <Input
              value={form.ingredient}
              onChange={(e) => setForm((p) => ({ ...p, ingredient: e.target.value }))}
              placeholder="e.g. Coconut"
            />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-slate-600">Denominators per Diet Type</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {DEFAULT_DIET_KEYS.map((dk) => (
                <div key={dk}>
                  <label className="mb-1 block text-xs text-slate-500">{dk}</label>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-400">÷</span>
                    <input
                      type="number"
                      min="0"
                      value={form.fractions[dk] ?? ""}
                      onChange={(e) => setForm((p) => ({ ...p, fractions: { ...p.fractions, [dk]: e.target.value } }))}
                      placeholder="—"
                      className="w-full rounded-lg border border-[#e2e8f0] bg-white px-2 py-1.5 text-sm outline-none focus:border-[#1E3A8A]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live formula preview */}
          <div className="rounded-lg bg-[#f0f4ff] px-3 py-2 font-mono text-sm text-[#1E3A8A]">
            <span className="font-bold">{form.ingredient || "?"}</span> = {formulaStr(form.fractions)}
          </div>

          <Button className="w-full" size="md" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : editItem ? "Update Formula" : "Create Formula"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

/* ═══════════════════ CATEGORY MANAGEMENT ═══════════════════ */
const DEFAULT_CATEGORIES = [
  "Rice & Cereals", "Pulses & Legumes", "Vegetables", "Fruits",
  "Meat & Poultry", "Fish & Seafood", "Dairy & Eggs", "Oils & Fats",
  "Spices & Condiments", "Beverages", "Others",
];

function CategoryManager({ toast }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [catName, setCatName] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/categories`, { headers: authHeaders() });
      setCategories(res.data?.categories || res.data || []);
    } catch {
      setCategories(DEFAULT_CATEGORIES.map((n, i) => ({ id: i + 1, name: n })));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const openAdd = () => { setEditCat(null); setCatName(""); setModal(true); };
  const openEdit = (c) => { setEditCat(c); setCatName(c.name); setModal(true); };

  const handleSave = async () => {
    if (!catName.trim()) { toast.push("Category name required", "error"); return; }
    setSaving(true);
    try {
      if (editCat) {
        await axios.put(`${API}/categories/${editCat.id}`, { name: catName.trim() }, { headers: authHeaders() });
        toast.push(`Category "${catName}" updated`);
      } else {
        await axios.post(`${API}/categories`, { name: catName.trim() }, { headers: authHeaders() });
        toast.push(`Category "${catName}" created`);
      }
      setModal(false);
      fetchCategories();
    } catch (e) {
      toast.push(e.response?.data?.message || "Save failed", "error");
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionTitle sub="Manage the 11 procurement item categories">🗂️ Item Category Management</SectionTitle>
        <Button onClick={openAdd}>➕ Add Category</Button>
      </div>

      {loading ? <Spinner /> : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c, i) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border border-[#e2e8f0] bg-white px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f0f4ff] text-xs font-bold text-[#1E3A8A]">
                  {i + 1}
                </span>
                <span className="text-sm font-medium text-slate-700">{c.name}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>✏️</Button>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="col-span-3 text-center text-sm text-slate-400 py-6">No categories yet.</p>
          )}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editCat ? "Edit Category" : "Add Category"}>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Category Name *</label>
            <Input
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
              placeholder="e.g. Rice & Cereals"
            />
          </div>
          <Button className="w-full" size="md" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : editCat ? "Update Category" : "Create Category"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

/* ═══════════════════ AUDIT TAB (mirrored from SystemAdmin) ═══════════════════ */
function AuditTab() {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [search, setSearch]   = useState("");
  const [query, setQuery]     = useState("");

  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchLogs = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const url = `${API}/audit${query ? `?q=${encodeURIComponent(query)}&module=HOSPITAL_ADMIN` : "?module=HOSPITAL_ADMIN"}`;
      const res = await axios.get(url, { headers: authHeaders() });
      const data = res.data;
      setLogs(data?.logs || data?.auditLogs || data?.rows || (Array.isArray(data) ? data : []));
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load audit logs");
    } finally { setLoading(false); }
  }, [query]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  function fmt(v) {
    if (!v) return "-";
    const d = new Date(v);
    return isNaN(d) ? String(v) : d.toLocaleString();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SectionTitle sub="All changes made in Hospital Admin are recorded here">📋 Hospital Admin Audit Trail</SectionTitle>
        <div className="flex gap-2">
          <Input
            className="max-w-xs"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button variant="outline" onClick={fetchLogs} disabled={loading}>🔄</Button>
        </div>
      </div>

      {loading && <Spinner />}
      {error && <ErrorBox msg={error} />}
      {!loading && !error && logs.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#e2e8f0] py-10 text-center text-sm text-slate-400">
          No audit logs found for this module.
        </div>
      )}
      {!loading && !error && logs.length > 0 && (
        <SimpleTable headers={["Time", "Actor", "Action", "Entity", "Detail"]}>
          {logs.map((log) => {
            const time   = log.created_at || log.createdAt || log.timestamp;
            const actor  = log.actor_email || log.user || log.email || "-";
            const action = log.action || log.message || "-";
            const entity = log.entity || log.type || log.module || "-";
            const detail = log.detail || log.description || log.meta || "-";
            return (
              <tr key={log.id || log.audit_id || log._id} className="bg-white">
                <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">{fmt(time)}</td>
                <td className="px-4 py-3 font-semibold text-[#1E3A8A]">{actor}</td>
                <td className="px-4 py-3">
                  <Badge label={action} color="blue" />
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{entity}</td>
                <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px] truncate" title={String(detail)}>{String(detail)}</td>
              </tr>
            );
          })}
        </SimpleTable>
      )}
    </div>
  );
}

/* ═══════════════════ MAIN COMPONENT ═══════════════════ */
const TABS = [
  { key: "wards",       label: "🏥 Wards"         },
  { key: "diet",        label: "🥗 Diet Types"     },
  { key: "normweights", label: "⚖️ Norm Weights"   },
  { key: "fractional",  label: "🔢 Fractional"     },
  { key: "categories",  label: "🗂️ Categories"     },
  { key: "audit",       label: "📋 Audit Trail"    },
];

function HospitalAdmin() {
  const [tab, setTab] = useState("wards");
  const toast = useToast();

  const token   = getToken();
  const jwtData = useMemo(() => (token ? decodeJwt(token) : null), [token]);
  const email   = jwtData?.email || "Unknown";
  const role    = jwtData?.role  || "";

  // Guard: only HOSPITAL_ADMIN may access this dashboard
  if (role && role !== "HOSPITAL_ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-2xl">🚫</p>
          <p className="mt-2 font-bold text-red-700">Access Denied</p>
          <p className="mt-1 text-sm text-red-600">This dashboard is restricted to <strong>HOSPITAL_ADMIN</strong> role.</p>
          <p className="mt-1 text-xs text-red-400">Your role: {role}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Top header bar */}
      <div className="sticky top-0 z-30 border-b border-[#e2e8f0] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div>
            <h1 className="text-lg font-black tracking-tight text-[#1E3A8A]">
              🏥 Hospital Administration
            </h1>
            <p className="text-xs text-slate-500">
              Configure wards, diets, formulas & categories
            </p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p className="font-semibold text-[#1E3A8A]">{email}</p>
            <Badge label="HOSPITAL_ADMIN" color="blue" />
          </div>
        </div>

        {/* Tab nav */}
        <div className="mx-auto max-w-7xl overflow-x-auto px-6">
          <div className="flex gap-1 border-t border-[#f1f5f9] pt-1 pb-0">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`whitespace-nowrap rounded-t-lg px-4 py-2 text-sm font-semibold transition
                  ${tab === t.key
                    ? "bg-[#1E3A8A] text-white"
                    : "text-slate-600 hover:bg-[#f0f4ff] hover:text-[#1E3A8A]"
                  }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-6 py-6">
        {tab === "wards"       && <WardConfig toast={toast} />}
        {tab === "diet"        && <DietConfig toast={toast} />}
        {tab === "normweights" && <NormWeightEditor toast={toast} />}
        {tab === "fractional"  && <FractionalEditor toast={toast} />}
        {tab === "categories"  && <CategoryManager toast={toast} />}
        {tab === "audit"       && <AuditTab />}
      </div>

      <Toast toasts={toast.toasts} />
    </div>
  );
}

export default HospitalAdmin;