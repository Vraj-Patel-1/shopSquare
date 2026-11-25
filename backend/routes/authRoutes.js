
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

function generateToken(user) {
  return jwt.sign(
    { id: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  };
}

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      password.length < 8 ||
      password.length > 128
    ) {
      return res.status(400).json({
        message: "Enter a valid name, email and password (8–128 characters)."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await User.findOne({
      email: normalizedEmail
    });

    if (existing) {
      return res.status(409).json({
        message: "Email is already registered."
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password
    });

    res.status(201).json({
      message: "Registration successful",
      user: publicUser(user),
      token: generateToken(user)
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Email is already registered."
      });
    }

    console.error("Registration error:", error.message);
    res.status(500).json({
      message: "Registration failed."
    });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message: "Email and password are required."
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    res.json({
      message: "Login successful",
      user: publicUser(user),
      token: generateToken(user)
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({
      message: "Login failed."
    });
  }
});

// CURRENT USER
router.get("/me", protect, (req, res) => {
  res.json({
    user: publicUser(req.user)
  });
});

module.exports = router;
