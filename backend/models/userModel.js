const pool = require("../config/db");

const findByEmail = async (email) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );
  return result.rows[0];
};

const createUser = async ({ full_name, email, password_hash, role }) => {
  const result = await pool.query(
    `INSERT INTO users (full_name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, full_name, email, role, is_active, created_at`,
    [full_name, email, password_hash, role]
  );
  return result.rows[0];
};

module.exports = {
  findByEmail,
  createUser,
};