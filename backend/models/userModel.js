const pool = require("../config/db");

// Get all users
const getAllUsers = async () => {
  const query = `
    SELECT 
      id,
      full_name AS name,
      username,
      email,
      role,
      status,
      COALESCE(last_login::text, 'Never') AS "lastLogin",
      two_fa_enabled AS "twoFA",
      created_at
    FROM users
    ORDER BY created_at DESC
  `;
  const result = await pool.query(query);
  return result.rows;
};

// Get user by id
const getUserById = async (id) => {
  const query = `
    SELECT 
      id,
      full_name AS name,
      username,
      email,
      role,
      status,
      COALESCE(last_login::text, 'Never') AS "lastLogin",
      two_fa_enabled AS "twoFA",
      created_at
    FROM users
    WHERE id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

// Create user
const createUser = async ({ name, username, email, role, status = "active", twoFA = false, passwordHash }) => {
  const query = `
    INSERT INTO users (
      full_name,
      username,
      email,
      role,
      status,
      two_fa_enabled,
      password_hash
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING 
      id,
      full_name AS name,
      username,
      email,
      role,
      status,
      COALESCE(last_login::text, 'Never') AS "lastLogin",
      two_fa_enabled AS "twoFA",
      created_at
  `;
  const values = [name, username, email, role, status, twoFA, passwordHash];
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Update user
const updateUser = async (id, { name, username, email, role, twoFA }) => {
  const query = `
    UPDATE users
    SET
      full_name = $1,
      username = $2,
      email = $3,
      role = $4,
      two_fa_enabled = $5,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $6
    RETURNING
      id,
      full_name AS name,
      username,
      email,
      role,
      status,
      COALESCE(last_login::text, 'Never') AS "lastLogin",
      two_fa_enabled AS "twoFA",
      created_at
  `;
  const values = [name, username, email, role, twoFA, id];
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Change status
const updateUserStatus = async (id, status) => {
  const query = `
    UPDATE users
    SET
      status = $1,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING
      id,
      full_name AS name,
      username,
      email,
      role,
      status,
      COALESCE(last_login::text, 'Never') AS "lastLogin",
      two_fa_enabled AS "twoFA",
      created_at
  `;
  const result = await pool.query(query, [status, id]);
  return result.rows[0];
};

// Reset password
const resetUserPassword = async (id, passwordHash) => {
  const query = `
    UPDATE users
    SET
      password_hash = $1,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING id, full_name AS name, email
  `;
  const result = await pool.query(query, [passwordHash, id]);
  return result.rows[0];
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  resetUserPassword,
};