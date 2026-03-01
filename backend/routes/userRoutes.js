const router = require("express").Router();
const { getUsers } = require("../controllers/userController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

// Only admins can view users
router.get("/", requireAuth, requireRole("SYSTEM_ADMIN", "HOSPITAL_ADMIN"), getUsers);

module.exports = router;