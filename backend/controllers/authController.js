const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const { writeAudit } = require("../utils/audit");

const ALLOWED_ROLES = new Set([
  "SYSTEM_ADMIN",
  "HOSPITAL_ADMIN",
  "DIET_CLERK",
  "SUBJECT_CLERK",
  "ACCOUNTANT",
  "KITCHEN",
]);

exports.register = async (req, res) => {
  try {
    const { full_name, email, password, role } = req.body;

    // basic validation
    if (!full_name || !email || !password || !role) {
      return res.status(400).json({ message: "full_name, email, password, role are required" });
    }

    // role validation (avoid DB CHECK errors)
    if (!ALLOWED_ROLES.has(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
        // ✅ audit: register attempt with existing email
      await writeAudit({
        req,
        action: "REGISTER_FAILED_EMAIL_EXISTS",
        entity: "users",
        actor_email: email,
        actor_role: role,
        details: { full_name },
      });
      return res.status(409).json({ message: "Email already exists" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const newUser = await User.createUser({
      full_name,
      email,
      password_hash,
      role,
    });
    // ✅ audit: register success
    await writeAudit({
      req,
      action: "REGISTER_SUCCESS",
      entity: "users",
      entity_id: newUser.id,
      actor_user_id: newUser.id,
      actor_email: newUser.email,
      actor_role: newUser.role,
      details: { full_name: newUser.full_name },
    });

    return res.status(201).json({
      message: "User created successfully",
      user: newUser,
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error.message);
    console.error("DETAIL:", error.detail);
    console.error("CODE:", error.code);

    // ✅ optional audit: register error
    await writeAudit({
      req,
      action: "REGISTER_ERROR",
      entity: "users",
      actor_email: req.body?.email || null,
      actor_role: req.body?.role || null,
      details: { message: error.message, code: error.code },
    });

    return res.status(500).json({
      message: "Registration failed",
      error: error.message,
      detail: error.detail,
      code: error.code,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    // use model instead of pool (pool was undefined in your code)
    const user = await User.findByEmail(email);

    if (!user) {
        // ✅ audit: login failed (no user)
      await writeAudit({
        req,
        action: "LOGIN_FAILED",
        entity: "users",
        actor_email: email,
        details: { reason: "user_not_found" },
      });
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.is_active) {
        // ✅ audit: login blocked (deactivated)
      await writeAudit({
        req,
        action: "LOGIN_BLOCKED",
        entity: "users",
        entity_id: user.id,
        actor_user_id: user.id,
        actor_email: user.email,
        actor_role: user.role,
        details: { reason: "deactivated" },
      });
      return res.status(403).json({ message: "Account is deactivated" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {

        // ✅ audit: login failed (wrong password)
      await writeAudit({
        req,
        action: "LOGIN_FAILED",
        entity: "users",
        entity_id: user.id,
        actor_user_id: user.id,
        actor_email: user.email,
        actor_role: user.role,
        details: { reason: "wrong_password" },
      });
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // ✅ audit: login success
    await writeAudit({
      req,
      action: "LOGIN_SUCCESS",
      entity: "users",
      entity_id: user.id,
      actor_user_id: user.id,
      actor_email: user.email,
      actor_role: user.role,
    });

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error.message);
    console.error("DETAIL:", error.detail);
    console.error("CODE:", error.code);

    // ✅ optional audit: login error
    await writeAudit({
      req,
      action: "LOGIN_ERROR",
      entity: "users",
      actor_email: req.body?.email || null,
      details: { message: error.message, code: error.code },
    });
    return res.status(500).json({
      message: "Login failed",
      error: error.message,
      detail: error.detail,
      code: error.code,
    });
  }
};

