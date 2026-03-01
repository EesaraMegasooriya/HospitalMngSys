// utils/audit.js
const pool = require("../config/db");

async function writeAudit({
  req,
  module = "SYSTEM",          // ✅ default (so never null)
  action,
  entity = null,
  entity_id = null,
  actor_user_id = null,
  actor_email = null,
  actor_role = null,
  details = null,
}) {
  const ip =
    req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() || req.ip;

  const user_agent = req.headers["user-agent"] || null;

  await pool.query(
    `INSERT INTO audit_logs
      (module, actor_user_id, actor_email, actor_role, action, entity, entity_id, ip, user_agent, details)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      module,
      actor_user_id,
      actor_email,
      actor_role,
      action,
      entity,
      entity_id ? String(entity_id) : null,
      ip,
      user_agent,
      details ? JSON.stringify(details) : null,
    ]
  );
}

module.exports = { writeAudit };