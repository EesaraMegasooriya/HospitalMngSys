// routes/auditRoutes.js
const router = require("express").Router();
const { requireAuth, requireRole } = require("../middleware/authMiddleware");
const { getAuditLogs } = require("../controllers/auditController");

router.get("/", requireAuth, requireRole("SYSTEM_ADMIN"), getAuditLogs);

module.exports = router;