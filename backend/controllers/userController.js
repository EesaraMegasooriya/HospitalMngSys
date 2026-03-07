const bcrypt = require("bcrypt");
const userModel = require("../models/userModel");

// GET /api/users
exports.getUsers = async (req, res) => {
  try {
    const users = await userModel.getAllUsers();
    res.status(200).json({ users });
  } catch (error) {
    console.error("GET USERS ERROR:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// POST /api/users
exports.createUser = async (req, res) => {
  try {
    const {
      name,
      username,
      email,
      role,
      status = "active",
      twoFA = false,
      password = "Temp@123",
    } = req.body;

    if (!name || !username || !email || !role) {
      return res.status(400).json({
        message: "name, username, email and role are required",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await userModel.createUser({
      name,
      username,
      email,
      role,
      status,
      twoFA,
      passwordHash,
    });

    res.status(201).json({
      message: "User created successfully",
      user: newUser,
    });
  } catch (error) {
    console.error("CREATE USER ERROR:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "Username or email already exists",
      });
    }

    res.status(500).json({ message: "Failed to create user" });
  }
};

// PUT /api/users/:id
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, username, email, role, twoFA = false } = req.body;

    if (!name || !username || !email || !role) {
      return res.status(400).json({
        message: "name, username, email and role are required",
      });
    }

    const updatedUser = await userModel.updateUser(id, {
      name,
      username,
      email,
      role,
      twoFA,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("UPDATE USER ERROR:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "Username or email already exists",
      });
    }

    res.status(500).json({ message: "Failed to update user" });
  }
};

// PATCH /api/users/:id/status
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "deactivated", "locked"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status value",
      });
    }

    const updatedUser = await userModel.updateUserStatus(id, status);

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User status updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("TOGGLE USER STATUS ERROR:", error);
    res.status(500).json({ message: "Failed to update user status" });
  }
};

// PATCH /api/users/:id/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const newPassword = "Temp@123";
    const passwordHash = await bcrypt.hash(newPassword, 10);

    const updatedUser = await userModel.resetUserPassword(id, passwordHash);

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: `Password reset successfully. Temporary password: ${newPassword}`,
      user: updatedUser,
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
};