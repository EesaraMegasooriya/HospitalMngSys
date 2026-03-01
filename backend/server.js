require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const auditRoutes = require("./routes/auditRoutes");
const hospitalAdminRoutes = require("./routes/hospitalAdminRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api", hospitalAdminRoutes); 

// quick health check
app.get("/health", (req, res) => res.json({ ok: true }));

// global error handler (simple)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));

app.get("/db-check", async (req, res) => {
  const r = await pool.query("SELECT current_database() as db, current_user as user;");
  res.json(r.rows[0]);
});