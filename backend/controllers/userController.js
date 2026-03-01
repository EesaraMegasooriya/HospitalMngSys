const pool = require("../config/db");

exports.getUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, full_name, email, role, is_active, created_at
       FROM users
       ORDER BY id DESC`
    );

    const users = result.rows.map((u) => ({
      id: u.id,
      name: u.full_name,
      email: u.email,
      role: u.role,
      status: u.is_active ? "active" : "locked",
      created_at: u.created_at,
    }));

    return res.json({ users });
  } catch (error) {
    console.error("GET USERS ERROR:", error.message);
    return res.status(500).json({ message: "Failed to fetch users" });
  }
};