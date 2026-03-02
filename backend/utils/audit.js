const pool = require("../config/db");

function safeJson(obj) {
  if (obj === undefined) return null;
  try {
    return JSON.stringify(obj);
  } catch {
    return JSON.stringify({ note: "UNSERIALIZABLE_DETAILS" });
  }
}

function getIp(req) {
  return (
    req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
    req.ip ||
    null
  );
}

async function writeAudit({
  req,
  module = "SYSTEM",
  action,
  entity = null,
  entity_id = null,
  details = null,

  // optional overrides:
  actor_user_id = null,
  actor_email = null,
  actor_role = null,
  success = true,
  status_code = null,
  duration_ms = null,
}) {
  try {
    const ip = getIp(req);
    const user_agent = req.headers["user-agent"] || null;

    // If authMiddleware sets req.user, use it automatically
    const actor = req.user || null;

    const final_actor_user_id = actor_user_id ?? actor?.id ?? actor?.user_id ?? null;
    const final_actor_email = actor_email ?? actor?.email ?? null;
    const final_actor_role = actor_role ?? actor?.role ?? null;

    // request metadata
    const method = req.method || null;
    const path = req.originalUrl || req.url || null;

    // request id / correlation id (optional but recommended)
    const request_id = req.request_id || req.headers["x-request-id"] || null;
    const correlation_id = req.headers["x-correlation-id"] || null;

    await pool.query(
      `INSERT INTO audit_logs
        (module, actor_user_id, actor_email, actor_role,
         action, entity, entity_id,
         ip, user_agent,
         method, path,
         request_id, correlation_id,
         status_code, duration_ms,
         success, details)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [
        module,
        final_actor_user_id,
        final_actor_email,
        final_actor_role,
        action,
        entity,
        entity_id ? String(entity_id) : null,
        ip,
        user_agent,
        method,
        path,
        request_id,
        correlation_id,
        status_code,
        duration_ms,
        success,
        safeJson(details),
      ]
    );
  } catch (err) {
    // IMPORTANT: never crash the API because audit failed
    console.error("[AUDIT_WRITE_FAILED]", err.message);
  }
}

module.exports = { writeAudit };