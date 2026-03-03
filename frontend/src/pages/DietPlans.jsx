import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, RefreshCcw, ToggleLeft, ToggleRight, Leaf } from "lucide-react";

const API_BASE = "http://localhost:5050/api";

const GREEN = {
  900: "#1a3a2a",
  800: "#1e4433",
  700: "#1f5c3c",
  600: "#246b45",
  500: "#2d7d52",
  400: "#3a9966",
  100: "#e8f5ee",
  50:  "#f2faf5",
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  .dp-root {
    font-family: 'DM Sans', sans-serif;
    color: #1a2319;
    min-height: 100vh;
    background: #f7faf8;
    padding: 2rem;
  }

  /* -------- toast -------- */
  .toast {
    position: fixed; top: 1.25rem; right: 1.25rem; z-index: 999;
    background: #1e4433; color: #fff;
    padding: .75rem 1.25rem; border-radius: 10px;
    font-size: .85rem; font-weight: 500;
    box-shadow: 0 8px 24px rgba(30,68,51,.25);
    animation: slideIn .25s ease;
  }
  @keyframes slideIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }

  /* -------- modal overlay -------- */
  .modal-overlay {
    position: fixed; inset:0; z-index:50;
    display:flex; align-items:center; justify-content:center; padding:1rem;
    background: rgba(15,30,20,.45); backdrop-filter: blur(4px);
    animation: fadeIn .2s ease;
  }
  @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }

  .modal-box {
    position: relative; width:100%; max-width:640px;
    background:#fff; border-radius:18px;
    box-shadow: 0 24px 64px rgba(30,68,51,.18);
    overflow: hidden;
    animation: popIn .25s cubic-bezier(.34,1.56,.64,1);
  }
  @keyframes popIn { from { opacity:0; transform:scale(.93) } to { opacity:1; transform:scale(1) } }

  .modal-header {
    display:flex; align-items:center; justify-content:space-between;
    padding: 1.25rem 1.5rem;
    background: linear-gradient(135deg, #1e4433 0%, #246b45 100%);
    color:#fff;
  }
  .modal-title {
    font-family: 'DM Serif Display', serif;
    font-size: 1.15rem; font-weight:400;
  }
  .modal-close {
    background:rgba(255,255,255,.15); border:none; cursor:pointer;
    border-radius:8px; padding:.35rem; color:#fff;
    display:flex; align-items:center;
    transition: background .15s;
  }
  .modal-close:hover { background:rgba(255,255,255,.25); }

  .modal-body { padding:1.5rem; }
  .modal-footer {
    display:flex; justify-content:flex-end; gap:.75rem;
    padding:1rem 1.5rem;
    border-top: 1px solid #e8f5ee;
    background: #f7faf8;
  }

  /* -------- header -------- */
  .dp-header {
    display:flex; align-items:flex-start; justify-content:space-between; gap:1rem;
    margin-bottom:1.75rem;
  }
  .dp-title {
    font-family:'DM Serif Display', serif;
    font-size:1.9rem; font-weight:400; color:#1a3a2a;
    margin:0 0 .25rem;
    line-height:1.15;
  }
  .dp-subtitle { font-size:.85rem; color:#5a7a65; margin:0; }

  /* -------- buttons -------- */
  .btn {
    display:inline-flex; align-items:center; gap:.45rem;
    border:none; cursor:pointer; border-radius:10px;
    font-size:.85rem; font-weight:500; font-family:inherit;
    transition: all .15s;
    padding:.6rem 1rem;
  }
  .btn-outline {
    background:#fff; border:1.5px solid #c8ddd1; color:#2d5c40;
  }
  .btn-outline:hover { background:#f0f9f4; border-color:#2d7d52; }

  .btn-primary {
    background: linear-gradient(135deg, #246b45 0%, #1e4433 100%);
    color:#fff;
    box-shadow: 0 4px 12px rgba(36,107,69,.3);
    padding:.6rem 1.25rem;
  }
  .btn-primary:hover {
    background: linear-gradient(135deg, #2d7d52 0%, #246b45 100%);
    box-shadow: 0 6px 16px rgba(36,107,69,.35);
    transform: translateY(-1px);
  }

  .btn-cancel {
    background:#fff; border:1.5px solid #dde8e2; color:#4a6357;
  }
  .btn-cancel:hover { background:#f0f9f4; }

  .btn-save {
    background: linear-gradient(135deg, #246b45 0%, #1e4433 100%);
    color:#fff;
    box-shadow: 0 4px 12px rgba(36,107,69,.25);
  }
  .btn-save:hover { background: linear-gradient(135deg, #2d7d52 0%, #246b45 100%); }

  /* -------- card / table -------- */
  .dp-card {
    background:#fff;
    border-radius:16px;
    border:1.5px solid #ddeae3;
    box-shadow: 0 2px 16px rgba(30,68,51,.06);
    overflow:hidden;
  }

  .dp-table { width:100%; border-collapse:collapse; }

  .dp-thead th {
    text-align:left; padding:.85rem 1rem;
    font-size:.7rem; font-weight:600;
    text-transform:uppercase; letter-spacing:.08em;
    color:#5a7a65;
    background: linear-gradient(180deg, #f2faf5 0%, #ebf6ef 100%);
    border-bottom: 1.5px solid #ddeae3;
  }
  .dp-thead th:last-child { text-align:right; }

  .dp-tbody tr {
    transition: background .12s;
    border-bottom:1px solid #f0f6f2;
  }
  .dp-tbody tr:last-child { border-bottom:none; }
  .dp-tbody tr:hover { background:#f7fcf9; }
  .dp-tbody tr.inactive { opacity:.6; }

  .dp-tbody td {
    padding:.9rem 1rem;
    font-size:.875rem;
    vertical-align:middle;
  }

  .code-badge {
    display:inline-block;
    background:#e8f5ee; color:#1e4433;
    border: 1px solid #c3dece;
    border-radius:6px;
    padding:.2rem .55rem;
    font-size:.78rem; font-weight:600;
    letter-spacing:.04em; font-family:monospace;
  }

  .type-pill {
    display:inline-flex; align-items:center;
    background:#f0f6f2; color:#2d5c40;
    border-radius:20px;
    padding:.2rem .7rem;
    font-size:.75rem; font-weight:500;
    border:1px solid #d1e8da;
  }

  .status-active {
    display:inline-flex; align-items:center; gap:.3rem;
    background:#e8f5ee; color:#1e4433;
    border-radius:20px; padding:.2rem .75rem;
    font-size:.75rem; font-weight:600;
    border:1px solid #b8dfc8;
  }
  .status-active::before { content:''; width:6px;height:6px;border-radius:50%;background:#2d7d52; }

  .status-inactive {
    display:inline-flex; align-items:center; gap:.3rem;
    background:#f5f5f5; color:#888;
    border-radius:20px; padding:.2rem .75rem;
    font-size:.75rem; font-weight:600;
    border:1px solid #e0e0e0;
  }
  .status-inactive::before { content:''; width:6px;height:6px;border-radius:50%;background:#bbb; }

  /* action buttons */
  .act-btn {
    background:none; border:none; cursor:pointer;
    border-radius:8px; padding:.45rem;
    display:inline-flex; align-items:center;
    transition: all .12s;
    color:#5a7a65;
  }
  .act-btn:hover { background:#e8f5ee; color:#1e4433; }
  .act-btn.danger:hover { background:#fff0f0; color:#c0392b; }
  .act-btn.toggle-on { color:#2d7d52; }
  .act-btn.toggle-off { color:#aaa; }
  .act-actions { display:flex; gap:.25rem; justify-content:flex-end; }

  /* -------- form fields -------- */
  .field-label {
    display:block; font-size:.75rem; font-weight:600;
    color:#2d5c40; margin-bottom:.35rem; letter-spacing:.02em;
  }
  .field-input, .field-select {
    width:100%; border:1.5px solid #d4e8da;
    border-radius:10px; padding:.6rem .85rem;
    font-size:.875rem; font-family:inherit;
    color:#1a3a2a; background:#fff;
    outline:none; transition: border .15s, box-shadow .15s;
  }
  .field-input:focus, .field-select:focus {
    border-color:#2d7d52;
    box-shadow: 0 0 0 3px rgba(45,125,82,.12);
  }
  .field-input:disabled { background:#f0f6f2; color:#7a9a87; }

  .form-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
  @media(max-width:500px) { .form-grid-2 { grid-template-columns:1fr; } }

  .checkbox-row {
    display:flex; align-items:center; gap:.6rem;
    padding:.6rem .85rem;
    border:1.5px solid #d4e8da; border-radius:10px;
    cursor:pointer;
    transition:background .12s;
  }
  .checkbox-row:hover { background:#f2faf5; }
  .checkbox-row input { accent-color:#2d7d52; width:16px;height:16px; }

  /* -------- empty state -------- */
  .empty {
    text-align:center; padding:3.5rem 1rem;
    color:#7a9a87; font-size:.9rem;
  }
  .empty-icon { font-size:2.5rem; margin-bottom:.75rem; }

  /* -------- loading -------- */
  .loading { text-align:center; padding:3.5rem; color:#7a9a87; }
  .spinner {
    width:28px; height:28px; border:3px solid #e8f5ee;
    border-top-color:#2d7d52; border-radius:50%;
    animation:spin .7s linear infinite; margin:0 auto 1rem;
  }
  @keyframes spin { to { transform:rotate(360deg); } }

  /* order badge */
  .order-num {
    display:inline-flex; align-items:center; justify-content:center;
    width:28px;height:28px; border-radius:50%;
    background:#f0f6f2; color:#2d5c40;
    font-size:.78rem; font-weight:600;
    border:1px solid #d1e8da;
  }

  /* decorative accent bar */
  .accent-bar {
    height:4px; background:linear-gradient(90deg,#1e4433,#3a9966,#1e4433);
    background-size:200% 100%; animation:shimmer 3s linear infinite;
  }
  @keyframes shimmer { from{background-position:0 0} to{background-position:200% 0} }
`;

/* ---- Toast ---- */
function Toast({ open, text, onClose }) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [open, onClose]);
  if (!open) return null;
  return <div className="toast">{text}</div>;
}

/* ---- Modal ---- */
function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose}><X size={18}/></button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-footer">{footer}</div>
      </div>
    </div>
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
    id:"", code:"", name:"", age_range:"All", plan_type:"Patient", display_order:1, active:true
  });

  const showToast = t => { setToastText(t); setToastOpen(true); };
  const getHeaders = () => {
    const token = sessionStorage.getItem("token");
    return { "Content-Type":"application/json", Authorization:`Bearer ${token}` };
  };
  const handle401 = () => { showToast("Session expired."); window.location.href="/login"; };
  const safeJson = async res => { try { return await res.json(); } catch { return null; } };

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/diet-plans`, { headers:getHeaders() });
      if (res.status===401) return handle401();
      if (!res.ok) throw new Error();
      const data = await safeJson(res);
      setPlans(data?.plans || []);
    } catch { showToast("Failed to load diet plans"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPlans(); }, []);

  const save = async () => {
    const code = String(form.code||"").trim();
    const name = String(form.name||"").trim();
    if (!code) return showToast("Code is required");
    if (!name) return showToast("Name is required");
    const payload = { code, name, age_range:form.age_range||"All", plan_type:form.plan_type||"Patient", display_order:Number(form.display_order)||1, active:!!form.active };
    try {
      if (isNew) {
        const res = await fetch(`${API_BASE}/diet-plans`, { method:"POST", headers:getHeaders(), body:JSON.stringify(payload) });
        if (res.status===401) return handle401();
        if (!res.ok) throw new Error();
        showToast("Diet Plan Added");
      } else {
        const res = await fetch(`${API_BASE}/diet-plans/${form.id}`, { method:"PUT", headers:getHeaders(), body:JSON.stringify(payload) });
        if (res.status===401) return handle401();
        if (!res.ok) throw new Error();
        showToast("Diet Plan Updated");
      }
      setModalOpen(false); fetchPlans();
    } catch { showToast("Operation failed"); }
  };

  const toggleActive = async id => {
    try {
      const res = await fetch(`${API_BASE}/diet-plans/${id}/toggle`, { method:"PATCH", headers:getHeaders() });
      if (res.status===401) return handle401();
      if (!res.ok) throw new Error();
      showToast("Status changed"); fetchPlans();
    } catch { showToast("Failed to change status"); }
  };

  const removePlan = async id => {
    if (!window.confirm("Delete this diet plan?")) return;
    try {
      const res = await fetch(`${API_BASE}/diet-plans/${id}`, { method:"DELETE", headers:getHeaders() });
      if (res.status===401) return handle401();
      if (!res.ok) throw new Error();
      showToast("Diet plan deleted"); fetchPlans();
    } catch { showToast("Delete failed"); }
  };

  const openNew = () => {
    setIsNew(true);
    setForm({ id:"", code:"", name:"", age_range:"All", plan_type:"Patient", display_order:(plans?.length||0)+1, active:true });
    setModalOpen(true);
  };
  const openEdit = p => {
    setIsNew(false);
    setForm({ id:p.id, code:p.code||"", name:p.name||"", age_range:p.age_range||"All", plan_type:p.plan_type||"Patient", display_order:Number(p.display_order)||1, active:!!p.active });
    setModalOpen(true);
  };
  const onNumber = v => { const n=parseInt(v,10); return Number.isFinite(n)?n:1; };

  return (
    <>
      <style>{styles}</style>
      <div className="dp-root">
        <Toast open={toastOpen} text={toastText} onClose={()=>setToastOpen(false)}/>

        {/* Header */}
        <div className="dp-header">
          <div>
            <h1 className="dp-title">
              <Leaf size={22} style={{display:"inline",marginRight:".4rem",color:"#2d7d52",verticalAlign:"middle"}}/>
              Diet Plan Management
            </h1>
            <p className="dp-subtitle">Create and manage diet plans used in meal scheduling.</p>
          </div>
          <div style={{display:"flex",gap:".6rem",alignItems:"center"}}>
            <button className="btn btn-outline" onClick={fetchPlans}>
              <RefreshCcw size={14}/> Refresh
            </button>
            <button className="btn btn-primary" onClick={openNew}>
              <Plus size={15}/> Add Diet Plan
            </button>
          </div>
        </div>

        {/* Table Card */}
        <div className="dp-card">
          <div className="accent-bar"/>
          <div style={{overflowX:"auto"}}>
            {loading ? (
              <div className="loading"><div className="spinner"/><div>Loading plans…</div></div>
            ) : (
              <table className="dp-table">
                <thead className="dp-thead">
                  <tr>
                    <th style={{paddingLeft:"1.25rem"}}>Code</th>
                    <th>Name</th>
                    <th>Age Range</th>
                    <th>Type</th>
                    <th style={{textAlign:"center"}}>Order</th>
                    <th>Status</th>
                    <th style={{textAlign:"right",paddingRight:"1.25rem"}}>Actions</th>
                  </tr>
                </thead>
                <tbody className="dp-tbody">
                  {plans.map(p=>(
                    <tr key={p.id} className={!p.active?"inactive":""}>
                      <td style={{paddingLeft:"1.25rem"}}>
                        <span className="code-badge">{p.code}</span>
                      </td>
                      <td style={{fontWeight:500,color:"#1a3a2a"}}>{p.name}</td>
                      <td style={{color:"#4a6a55"}}>{p.age_range||"All"}</td>
                      <td><span className="type-pill">{p.plan_type||"Patient"}</span></td>
                      <td style={{textAlign:"center"}}><span className="order-num">{p.display_order}</span></td>
                      <td>
                        {p.active
                          ? <span className="status-active">Active</span>
                          : <span className="status-inactive">Inactive</span>
                        }
                      </td>
                      <td style={{paddingRight:"1.25rem"}}>
                        <div className="act-actions">
                          <button className="act-btn" onClick={()=>openEdit(p)} title="Edit"><Pencil size={15}/></button>
                          <button className={`act-btn ${p.active?"toggle-on":"toggle-off"}`} onClick={()=>toggleActive(p.id)} title={p.active?"Deactivate":"Activate"}>
                            {p.active?<ToggleRight size={17}/>:<ToggleLeft size={17}/>}
                          </button>
                          <button className="act-btn danger" onClick={()=>removePlan(p.id)} title="Delete"><Trash2 size={15}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {plans.length===0&&(
                    <tr>
                      <td colSpan={7}>
                        <div className="empty">
                          <div className="empty-icon">🥗</div>
                          <div>No diet plans yet. Add your first one!</div>
                        </div>
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
          title={isNew?"Add Diet Plan":"Edit Diet Plan"}
          onClose={()=>setModalOpen(false)}
          footer={
            <>
              <button className="btn btn-cancel" onClick={()=>setModalOpen(false)}>Cancel</button>
              <button className="btn btn-save btn" onClick={save}>{isNew?"Add Plan":"Save Changes"}</button>
            </>
          }
        >
          <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
            <div className="form-grid-2">
              <div>
                <label className="field-label">Code</label>
                <input className="field-input" value={form.code} onChange={e=>setForm(p=>({...p,code:e.target.value}))} placeholder="e.g. DT001" disabled={!isNew}/>
              </div>
              <div>
                <label className="field-label">Name</label>
                <input className="field-input" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Diabetic Diet"/>
              </div>
            </div>
            <div className="form-grid-2">
              <div>
                <label className="field-label">Age Range</label>
                <select className="field-select" value={form.age_range} onChange={e=>setForm(p=>({...p,age_range:e.target.value}))}>
                  <option value="All">All</option>
                  <option value="Adult">Adult</option>
                  <option value="Child">Child</option>
                  <option value="Elder">Elder</option>
                </select>
              </div>
              <div>
                <label className="field-label">Plan Type</label>
                <select className="field-select" value={form.plan_type} onChange={e=>setForm(p=>({...p,plan_type:e.target.value}))}>
                  <option value="Patient">Patient</option>
                  <option value="Staff">Staff</option>
                  <option value="Visitor">Visitor</option>
                </select>
              </div>
            </div>
            <div className="form-grid-2">
              <div>
                <label className="field-label">Display Order</label>
                <input className="field-input" type="number" min={1} value={form.display_order} onChange={e=>setForm(p=>({...p,display_order:onNumber(e.target.value)}))}/>
              </div>
              {!isNew&&(
                <div style={{display:"flex",alignItems:"flex-end"}}>
                  <label className="checkbox-row" style={{width:"100%"}}>
                    <input type="checkbox" checked={form.active} onChange={e=>setForm(p=>({...p,active:e.target.checked}))}/>
                    <span style={{fontSize:".875rem",color:"#2d5c40",fontWeight:500}}>Mark as Active</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
}