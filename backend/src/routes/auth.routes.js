import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = Router();

/* =========================================================
   JWT
========================================================= */

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

/* =========================================================
   SIGNUP
   Email + Password only
========================================================= */

router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Required fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    // Password validation
    if (String(password).length < 6) {
      return res.status(400).json({
        message: "Password must contain at least 6 characters.",
      });
    }

    // Check existing email
    const exists = await User.findOne({
      email: normalizedEmail,
    });

    if (exists) {
      return res.status(409).json({
        message: "Email already registered.",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create account
    const user = await User.create({
      email: normalizedEmail,
      passwordHash,

      // Profile will be completed later
      profileCompleted: false,
    });

    const token = signToken(user._id.toString());

    return res.status(201).json({
      message: "Account created successfully.",
      token,
      user: sanitize(user),
    });
  } catch (error) {
    console.error("SIGNUP ERROR:", error);

    return res.status(500).json({
      message: "Signup failed.",
    });
  }
});

/* =========================================================
   LOGIN
   Email + Password
========================================================= */

router.post("/login", async (req, res) => {
  try {
    const { identifier, email, password } = req.body;

    // Support both:
    // { identifier, password }
    // and
    // { email, password }

    const loginEmail = identifier || email;

    if (!loginEmail || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = String(loginEmail).trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const token = signToken(user._id.toString());

    return res.json({
      message: "Login successful.",
      token,
      user: sanitize(user),
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      message: "Login failed.",
    });
  }
});



function sanitize(user) {
  const obj = user.toObject ? user.toObject() : { ...user };

  delete obj.passwordHash;

  return obj;
}

export default router;
