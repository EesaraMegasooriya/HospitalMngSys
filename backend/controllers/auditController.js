// controllers/auditController.js
const pool = require("../config/db");

exports.getAuditLogs = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const limit = Math.min(Number(req.query.limit) || 200, 500);

    const params = [];
    let where = "WHERE 1=1";

    if (q) {
      params.push(`%${q}%`);
      const p = `$${params.length}`;
      where += ` AND (
        actor_email ILIKE ${p}
        OR actor_role ILIKE ${p}
        OR action ILIKE ${p}
        OR entity ILIKE ${p}
        OR COALESCE(details::text,'') ILIKE ${p}
        OR COALESCE(ip,'') ILIKE ${p}
      )`;
    }

    params.push(limit);

    const sql = `
      SELECT id, created_at, actor_user_id, actor_email, actor_role,
             action, entity, entity_id, ip, user_agent, details
      FROM audit_logs
      ${where}
      ORDER BY created_at DESC
      LIMIT $${params.length}
    `;

    const r = await pool.query(sql, params);
    res.json({ logs: r.rows });
  } catch (err) {
    console.error("GET AUDIT LOGS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch audit logs" });
  }
};