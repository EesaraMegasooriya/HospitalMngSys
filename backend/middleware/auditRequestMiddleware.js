const crypto = require("crypto");

function auditRequestMiddleware(req, res, next) {
  const start = Date.now();

  // Add request_id once for whole request lifecycle
  req.request_id = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString("hex");

  // expose request id to client (useful for debugging)
  res.setHeader("x-request-id", req.request_id);

  res.on("finish", () => {
    req._duration_ms = Date.now() - start;
    req._status_code = res.statusCode;
  });

  next();
}

module.exports = { auditRequestMiddleware };