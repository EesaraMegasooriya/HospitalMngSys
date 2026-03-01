import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";

/* -------------------- Small UI Pieces (No external imports) -------------------- */
function Button({
  children,
  variant = "primary",
  size = "sm",
  className = "",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed";
  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2.5 text-sm",
  };
  const variants = {
    primary: "bg-[#1a4030] text-white hover:opacity-95",
    outline:
      "border border-[#d4e8da] bg-white text-[#1a4030] hover:bg-[#f1f6f3]",
    ghost: "bg-transparent text-[#1a4030] hover:bg-[#eef6f1]",
  };
  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full rounded-lg border border-[#d4e8da] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#3a8f68]/20 focus:border-[#3a8f68] ${className}`}
      {...props}
    />
  );
}

function StatusBadge({ status }) {
  const map = {
    active: {
      label: "Active",
      cls: "bg-green-100 text-green-700 border-green-200",
    },
    locked: { label: "Locked", cls: "bg-red-100 text-red-700 border-red-200" },
    pending: {
      label: "Pending",
      cls: "bg-yellow-100 text-yellow-700 border-yellow-200",
    },
  };
  const item = map[status] || {
    label: String(status),
    cls: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${item.cls}`}
    >
      {item.label}
    </span>
  );
}

function Pill({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#d4e8da] bg-[#f1f6f3] px-2.5 py-1 text-xs font-semibold text-[#1a4030]">
      {children}
    </span>
  );
}

function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#eef6f1] px-5 py-4">
          <h3 className="text-base font-bold text-[#1a4030]">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm font-semibold text-[#1a4030] hover:bg-[#eef6f1]"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function Select({ value, onChange, options = [], placeholder = "Select..." }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className="w-full rounded-lg border border-[#d4e8da] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#3a8f68]/20 focus:border-[#3a8f68]"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Card({ children }) {
  return (
    <div className="rounded-xl border border-[#d4e8da] bg-white p-4 shadow-sm">
      {children}
    </div>
  );
}

function SimpleTable({ headers = [], children }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#d4e8da]">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-[#f1f6f3]">
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left font-bold text-[#1a4030]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#eef6f1]">{children}</tbody>
      </table>
    </div>
  );
}

function decodeJwt(token) {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return null;

    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");

    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/* -------------------- Page -------------------- */
function SystemAdminDashboard() {
  const [tab, setTab] = useState("users"); // "users" | "audit"
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [auditLogs, setAuditLogs] = useState([]);
const [loadingAudit, setLoadingAudit] = useState(false);
const [auditError, setAuditError] = useState("");
const [auditSearch, setAuditSearch] = useState("");
const [auditQuery, setAuditQuery] = useState("");


  // Modal + form
  const [openAdd, setOpenAdd] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "" });

  const roleOptions = [
    { value: "Hospital Admin", label: "Hospital Admin" },
    { value: "Diet Clerk", label: "Diet Clerk" },
    { value: "Subject Clerk", label: "Subject Clerk" },
    { value: "Accountant", label: "Accountant" },
    { value: "Kitchen", label: "Kitchen" },
  ];

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.role || "").toLowerCase().includes(q),
    );
  }, [users, search]);

  

const token = sessionStorage.getItem("token") || localStorage.getItem("token");
const jwtData = useMemo(() => (token ? decodeJwt(token) : null), [token]);

const currentEmail = jwtData?.email || "";
const currentRole = jwtData?.role || "";


useEffect(() => {
  const t = setTimeout(() => {
    setAuditQuery(auditSearch.trim());
  }, 400);

  return () => clearTimeout(t);
}, [auditSearch]);
  useEffect(() => {
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      setUsersError("");

      const token = sessionStorage.getItem("token") || localStorage.getItem("token");
      if (!token) {
        setUsersError("No token found. Please login again.");
        setLoadingUsers(false);
        return;
      }

      const decoded = decodeJwt(token);
      if (!decoded?.role) {
        setUsersError("Invalid token payload. Please login again.");
        setLoadingUsers(false);
        return;
      }

      const res = await axios.get("http://localhost:5050/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers(res.data?.users || []);
    } catch (err) {
      setUsersError(err.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoadingUsers(false);
    }
  };

  fetchUsers();
}, [token]);

const fetchAuditLogs = async () => {
  try {
    setLoadingAudit(true);
    setAuditError("");

    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (!token) {
      setAuditError("No token found. Please login again.");
      setLoadingAudit(false);
      return;
    }

    const url = `http://localhost:5050/api/audit${auditQuery ? `?q=${encodeURIComponent(auditQuery)}` : ""}`;

    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // support multiple backend shapes
    const data = res.data;
    const logs =
      data?.logs ||
      data?.auditLogs ||
      data?.rows ||
      (Array.isArray(data) ? data : []);

    setAuditLogs(logs);
  } catch (err) {
    setAuditError(err.response?.data?.message || "Failed to fetch audit logs");
  } finally {
    setLoadingAudit(false);
  }
};

useEffect(() => {
  if (tab !== "audit") return;
  fetchAuditLogs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [tab, auditQuery]);



  const handleCreateUser = () => {
    // For now: UI only (mock). Later you’ll connect to backend.
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.role.trim()) {
      alert("Please fill name, email, and role.");
      return;
    }
    alert(`User Created (mock): ${newUser.name} (${newUser.role})`);
    setOpenAdd(false);
    setNewUser({ name: "", email: "", role: "" });
  };

  const handleReset = (user) => {
    alert(`Password reset (mock) for: ${user.email}`);
  };

  return (
    <div className="min-h-screen bg-[#f1f6f3] p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
  <h2 className="text-xl font-bold text-[#1a4030]">
    System Administration
  </h2>

  <p className="text-sm text-[#617a6b]">
    Manage users, roles & audit trail
  </p>

  <div className="mt-1 text-xs text-[#617a6b]">
    Logged in as{" "}
    <span className="font-semibold">{currentEmail || "Unknown"}</span>
    {currentRole ? (
      <>
        {" "}• Role: <span className="font-semibold">{currentRole}</span>
      </>
    ) : null}
  </div>
</div>

          <div className="flex gap-2">
            <Button
              variant={tab === "users" ? "primary" : "outline"}
              onClick={() => setTab("users")}
            >
              🛡 Users
            </Button>
            <Button
              variant={tab === "audit" ? "primary" : "outline"}
              onClick={() => setTab("audit")}
            >
              📄 Audit Logs
            </Button>
          </div>
        </div>

        {/* Users Tab */}
        {tab === "users" && (
          <Card>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full max-w-sm">
                <Input
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <Button onClick={() => setOpenAdd(true)}>➕ Add User</Button>
            </div>

            <div className="mt-4">
              {loadingUsers && (
                <div className="text-sm text-[#617a6b]">Loading users...</div>
              )}

              {usersError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {usersError}
                </div>
              )}

              {!loadingUsers && !usersError && (
                <SimpleTable
                  headers={["Name", "Email", "Role", "Status", "Actions"]}
                >
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="bg-white">
                      <td className="px-4 py-3 font-semibold text-[#1a4030]">
                        {user.name}
                      </td>
                      <td className="px-4 py-3 text-[#617a6b]">{user.email}</td>
                      <td className="px-4 py-3">{user.role}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={user.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          onClick={() => handleReset(user)}
                        >
                          🔁 Reset
                        </Button>
                      </td>
                    </tr>
                  ))}
                </SimpleTable>
              )}
            </div>

            {/* Add User Modal */}
            <Modal
              open={openAdd}
              onClose={() => setOpenAdd(false)}
              title="Add New User"
            >
              <div className="space-y-3">
                <Input
                  placeholder="Full Name"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser((p) => ({ ...p, name: e.target.value }))
                  }
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser((p) => ({ ...p, email: e.target.value }))
                  }
                />
                <Select
                  value={newUser.role}
                  onChange={(val) => setNewUser((p) => ({ ...p, role: val }))}
                  options={roleOptions}
                  placeholder="Assign Role"
                />
                <Button className="w-full" onClick={handleCreateUser}>
                  Create User
                </Button>
              </div>
            </Modal>
          </Card>
        )}

        {/* Audit Tab */}
        {tab === "audit" && (
  <Card>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-sm w-full">
        <Input
          placeholder="Search logs (email, action, entity...)"
          value={auditSearch}
          onChange={(e) => setAuditSearch(e.target.value)}
        />
        <div className="mt-1 text-xs text-[#617a6b]">
          Tip: try “USER”, “LOGIN”, “RESET”, or an email
        </div>
      </div>

      <div className="flex gap-2">
        <Button
  variant="outline"
  onClick={() => {
    setAuditQuery(auditSearch.trim()); // force instant search
  }}
  disabled={loadingAudit}
>
          🔄 Refresh
        </Button>
      </div>
    </div>

    <div className="mt-4">
      {loadingAudit && (
        <div className="text-sm text-[#617a6b]">Loading audit logs...</div>
      )}

      {auditError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {auditError}
        </div>
      )}

      {!loadingAudit && !auditError && auditLogs.length === 0 && (
        <div className="rounded-lg border border-[#d4e8da] bg-[#f1f6f3] px-4 py-3 text-sm text-[#617a6b]">
          No audit logs found.
        </div>
      )}

      {!loadingAudit && !auditError && auditLogs.length > 0 && (
        <SimpleTable headers={["Time", "Actor", "Action", "Entity"]}>
          {auditLogs.map((log) => {
            const time = log.created_at || log.createdAt || log.timestamp;
            const actor = log.actor_email || log.user || log.email || "-";
            const action = log.action || log.message || "-";
            const entity = log.entity || log.type || log.module || "-";

            return (
              <tr key={log.id || log.audit_id || log._id} className="bg-white">
                <td className="px-4 py-3 font-mono text-xs text-[#617a6b]">
                  {formatDateTime(time)}
                </td>
                <td className="px-4 py-3 font-semibold text-[#1a4030]">
                  {actor}
                </td>
                <td className="px-4 py-3">
                  <Pill>{action}</Pill>
                </td>
                <td className="px-4 py-3">{entity}</td>
              </tr>
            );
          })}
        </SimpleTable>
      )}
    </div>
  </Card>
)}
      </div>
    </div>
  );
}

export default SystemAdminDashboard;
