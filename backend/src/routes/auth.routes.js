import { Router } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendVerificationOtp } from "../services/email.service.js";

const router = Router();

/* =========================================================
   OTP CONFIG
========================================================= */
const OTP_EXPIRY_MINUTES = 10;
const OTP_EXPIRY_MS = OTP_EXPIRY_MINUTES * 60 * 1000;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const OTP_RESEND_COOLDOWN_MS = OTP_RESEND_COOLDOWN_SECONDS * 1000;
const MAX_OTP_ATTEMPTS = 5;

/* =========================================================
   JWT
========================================================= */
function signToken(userId) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing from environment variables.");
  }
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

/* =========================================================
   HELPERS & VALIDATORS
========================================================= */
function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashOtp(otp) {
  return crypto.createHash("sha256").update(String(otp)).digest("hex");
}

function safeCompareHash(storedHash, submittedHash) {
  if (!storedHash || !submittedHash) return false;
  const storedBuf = Buffer.from(storedHash, "hex");
  const submittedBuf = Buffer.from(submittedHash, "hex");
  if (storedBuf.length !== submittedBuf.length) return false;
  return crypto.timingSafeEqual(storedBuf, submittedBuf);
}

function sanitize(user) {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.emailOtpHash;
  delete obj.emailOtpExpiresAt;
  delete obj.emailOtpAttempts;
  delete obj.emailOtpLastSentAt;
  delete obj.emailOtpPurpose;
  return obj;
}

function getRemainingCooldown(user) {
  if (!user.emailOtpLastSentAt) return 0;
  const elapsed = Date.now() - new Date(user.emailOtpLastSentAt).getTime();
  const remaining = OTP_RESEND_COOLDOWN_MS - elapsed;
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

/* =========================================================
   CREATE & SEND OTP
========================================================= */
async function createAndSendOtp(user, purpose) {
  const remainingCooldown = getRemainingCooldown(user);
  if (remainingCooldown > 0) {
    const error = new Error(
      `Please wait ${remainingCooldown} seconds before requesting another code.`,
    );
    error.statusCode = 429;
    error.remainingCooldown = remainingCooldown;
    throw error;
  }

  const otp = generateOtp();
  user.emailOtpHash = hashOtp(otp);
  user.emailOtpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
  user.emailOtpAttempts = 0;
  user.emailOtpLastSentAt = new Date();
  user.emailOtpPurpose = purpose;

  await user.save();

  try {
    await sendVerificationOtp(user.email, otp);
  } catch (error) {
    // Reset OTP fields if email delivery fails
    user.emailOtpHash = null;
    user.emailOtpExpiresAt = null;
    user.emailOtpAttempts = 0;
    user.emailOtpLastSentAt = null;
    user.emailOtpPurpose = null;
    await user.save();
    throw error;
  }
}

/* =========================================================
   ROUTES
========================================================= */

// 1. SIGNUP (EMAIL ONLY)
router.post("/signup", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }
    if (!isValidEmail(email)) {
      return res
        .status(400)
        .json({ message: "Please enter a valid email address." });
    }

    let user = await User.findOne({ email });

    if (user && user.emailVerified) {
      return res
        .status(409)
        .json({ message: "Email already registered. Please login." });
    }

    if (!user) {
      user = await User.create({
        email,
        emailVerified: false,
        profileCompleted: false,
      });
    }

    await createAndSendOtp(user, "signup");

    return res.status(200).json({
      message: "Verification code sent to your email.",
      email,
      expiresIn: OTP_EXPIRY_MINUTES * 60,
    });
  } catch (error) {
    console.error("SIGNUP OTP ERROR:", error);
    if (error.statusCode === 429) {
      return res.status(429).json({
        message: error.message,
        retryAfter: error.remainingCooldown,
      });
    }
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email already registered." });
    }
    return res.status(500).json({
      message: error.message || "Unable to send verification code.",
    });
  }
});

// 2. VERIFY SIGNUP OTP
router.post("/verify-signup", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || "").trim();

    if (!email || !otp) {
      return res
        .status(400)
        .json({ message: "Email and verification code are required." });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email address." });
    }
    if (!/^\d{6}$/.test(otp)) {
      return res
        .status(400)
        .json({ message: "Verification code must contain 6 digits." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({
          message: "Signup session not found. Please request a new code.",
        });
    }
    if (user.emailVerified) {
      return res
        .status(409)
        .json({ message: "Email is already verified. Please login." });
    }
    if (user.emailOtpPurpose !== "signup") {
      return res
        .status(400)
        .json({
          message:
            "This verification code is no longer valid. Please request a new code.",
        });
    }
    if (
      !user.emailOtpExpiresAt ||
      new Date(user.emailOtpExpiresAt).getTime() < Date.now()
    ) {
      return res
        .status(400)
        .json({
          message: "Verification code has expired. Please request a new code.",
        });
    }
    if (user.emailOtpAttempts >= MAX_OTP_ATTEMPTS) {
      return res
        .status(429)
        .json({
          message: "Too many incorrect attempts. Please request a new code.",
        });
    }

    const submittedOtpHash = hashOtp(otp);
    if (!safeCompareHash(user.emailOtpHash, submittedOtpHash)) {
      user.emailOtpAttempts += 1;
      await user.save();

      const attemptsRemaining = Math.max(
        0,
        MAX_OTP_ATTEMPTS - user.emailOtpAttempts,
      );
      return res.status(400).json({
        message:
          attemptsRemaining > 0
            ? `Incorrect verification code. ${attemptsRemaining} attempts remaining.`
            : "Too many incorrect attempts. Please request a new code.",
      });
    }

    // Mark email as verified and clear OTP credentials
    user.emailVerified = true;
    user.emailOtpHash = null;
    user.emailOtpExpiresAt = null;
    user.emailOtpAttempts = 0;
    user.emailOtpLastSentAt = null;
    user.emailOtpPurpose = null;
    user.profileCompleted = false;
    await user.save();

    const token = signToken(user._id.toString());
    return res.status(201).json({
      message: "Email verified successfully. Account created.",
      token,
      user: sanitize(user),
    });
  } catch (error) {
    console.error("VERIFY SIGNUP ERROR:", error);
    return res
      .status(500)
      .json({ message: error.message || "Unable to verify email." });
  }
});

// 3. LOGIN (REQUEST OTP)
router.post("/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email || req.body.identifier);

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }
    if (!isValidEmail(email)) {
      return res
        .status(400)
        .json({ message: "Please enter a valid email address." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({
          message: "No account found with this email. Please sign up first.",
        });
    }
    if (!user.emailVerified) {
      return res
        .status(403)
        .json({
          message:
            "Email is not verified. Please complete signup verification.",
        });
    }

    await createAndSendOtp(user, "login");

    return res.status(200).json({
      message: "Login verification code sent to your email.",
      email,
      expiresIn: OTP_EXPIRY_MINUTES * 60,
    });
  } catch (error) {
    console.error("LOGIN OTP ERROR:", error);
    if (error.statusCode === 429) {
      return res.status(429).json({
        message: error.message,
        retryAfter: error.remainingCooldown,
      });
    }
    return res
      .status(500)
      .json({ message: error.message || "Unable to send login code." });
  }
});

// 4. VERIFY LOGIN OTP
router.post("/verify-login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || "").trim();

    if (!email || !otp) {
      return res
        .status(400)
        .json({ message: "Email and verification code are required." });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email address." });
    }
    if (!/^\d{6}$/.test(otp)) {
      return res
        .status(400)
        .json({ message: "Verification code must contain 6 digits." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "No account found with this email." });
    }
    if (!user.emailVerified) {
      return res
        .status(403)
        .json({ message: "Please verify your email first." });
    }
    if (user.emailOtpPurpose !== "login") {
      return res
        .status(400)
        .json({
          message:
            "This login code is no longer valid. Please request a new code.",
        });
    }
    if (
      !user.emailOtpExpiresAt ||
      new Date(user.emailOtpExpiresAt).getTime() < Date.now()
    ) {
      return res
        .status(400)
        .json({
          message: "Login code has expired. Please request a new code.",
        });
    }
    if (user.emailOtpAttempts >= MAX_OTP_ATTEMPTS) {
      return res
        .status(429)
        .json({
          message: "Too many incorrect attempts. Please request a new code.",
        });
    }

    const submittedOtpHash = hashOtp(otp);
    if (!safeCompareHash(user.emailOtpHash, submittedOtpHash)) {
      user.emailOtpAttempts += 1;
      await user.save();

      const attemptsRemaining = Math.max(
        0,
        MAX_OTP_ATTEMPTS - user.emailOtpAttempts,
      );
      return res.status(400).json({
        message:
          attemptsRemaining > 0
            ? `Incorrect verification code. ${attemptsRemaining} attempts remaining.`
            : "Too many incorrect attempts. Please request a new code.",
      });
    }

    // Clear OTP fields
    user.emailOtpHash = null;
    user.emailOtpExpiresAt = null;
    user.emailOtpAttempts = 0;
    user.emailOtpLastSentAt = null;
    user.emailOtpPurpose = null;
    await user.save();

    const token = signToken(user._id.toString());
    return res.status(200).json({
      message: "Login successful.",
      token,
      user: sanitize(user),
    });
  } catch (error) {
    console.error("VERIFY LOGIN ERROR:", error);
    return res
      .status(500)
      .json({ message: error.message || "Unable to verify login code." });
  }
});

// 5. RESEND SIGNUP OTP
router.post("/resend-signup-otp", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }
    if (!isValidEmail(email)) {
      return res
        .status(400)
        .json({ message: "Please enter a valid email address." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Signup session not found." });
    }
    if (user.emailVerified) {
      return res
        .status(409)
        .json({ message: "Email is already verified. Please login." });
    }

    await createAndSendOtp(user, "signup");

    return res.status(200).json({
      message: "A new verification code has been sent.",
      expiresIn: OTP_EXPIRY_MINUTES * 60,
    });
  } catch (error) {
    console.error("RESEND SIGNUP OTP ERROR:", error);
    if (error.statusCode === 429) {
      return res.status(429).json({
        message: error.message,
        retryAfter: error.remainingCooldown,
      });
    }
    return res
      .status(500)
      .json({
        message: error.message || "Unable to resend verification code.",
      });
  }
});

// 6. RESEND LOGIN OTP
router.post("/resend-login-otp", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }
    if (!isValidEmail(email)) {
      return res
        .status(400)
        .json({ message: "Please enter a valid email address." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "No account found with this email." });
    }
    if (!user.emailVerified) {
      return res
        .status(403)
        .json({ message: "Please verify your email first." });
    }

    await createAndSendOtp(user, "login");

    return res.status(200).json({
      message: "A new login code has been sent.",
      expiresIn: OTP_EXPIRY_MINUTES * 60,
    });
  } catch (error) {
    console.error("RESEND LOGIN OTP ERROR:", error);
    if (error.statusCode === 429) {
      return res.status(429).json({
        message: error.message,
        retryAfter: error.remainingCooldown,
      });
    }
    return res
      .status(500)
      .json({ message: error.message || "Unable to resend login code." });
  }
});

export default router;
