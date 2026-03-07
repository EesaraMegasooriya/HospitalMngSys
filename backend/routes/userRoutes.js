const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// GET all users
router.get("/", userController.getUsers);

// CREATE new user
router.post("/", userController.createUser);

// UPDATE user
router.put("/:id", userController.updateUser);

// ACTIVATE / DEACTIVATE / LOCK
router.patch("/:id/status", userController.toggleUserStatus);

// RESET password
router.patch("/:id/reset-password", userController.resetPassword);

module.exports = router;