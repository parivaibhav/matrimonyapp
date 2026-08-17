import { Router } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import { sendVerificationOtp } from "../services/email.service.js";

const router = Router();

/* =========================================================
   OTP CONFIGURATION
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

  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

/* =========================================================
   EMAIL HELPERS
========================================================= */

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* =========================================================
   OTP HELPERS
========================================================= */

function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashOtp(otp) {
  return crypto.createHash("sha256").update(String(otp)).digest("hex");
}

function safeCompareHash(storedHash, submittedHash) {
  if (!storedHash || !submittedHash) {
    return false;
  }

  const storedBuffer = Buffer.from(storedHash, "hex");

  const submittedBuffer = Buffer.from(submittedHash, "hex");

  if (storedBuffer.length !== submittedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(storedBuffer, submittedBuffer);
}

/* =========================================================
   USER SANITIZATION
========================================================= */

function sanitize(user) {
  const obj = user.toObject ? user.toObject() : { ...user };

  // Remove OTP/security fields
  delete obj.emailOtpHash;
  delete obj.emailOtpExpiresAt;
  delete obj.emailOtpAttempts;
  delete obj.emailOtpLastSentAt;
  delete obj.emailOtpPurpose;

  // Remove password fields if they exist
  delete obj.password;
  delete obj.passwordHash;

  return obj;
}

/* =========================================================
   OTP COOLDOWN
========================================================= */

function getRemainingCooldown(user) {
  if (!user.emailOtpLastSentAt) {
    return 0;
  }

  const sentAt = new Date(user.emailOtpLastSentAt).getTime();

  const elapsed = Date.now() - sentAt;

  const remaining = OTP_RESEND_COOLDOWN_MS - elapsed;

  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

/* =========================================================
   CREATE + SEND OTP
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

  /*
   * Store only the hashed OTP.
   */
  user.emailOtpHash = hashOtp(otp);

  user.emailOtpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  user.emailOtpAttempts = 0;

  user.emailOtpLastSentAt = new Date();

  user.emailOtpPurpose = purpose;

  await user.save();

  try {
    /*
     * Nodemailer + Gmail
     */
    await sendVerificationOtp(user.email, otp);

    console.log(`OTP sent successfully to ${user.email}`);

    return true;
  } catch (error) {
    console.error("EMAIL DELIVERY ERROR:", error);

    /*
     * Email failed.
     * Remove OTP so it cannot be used.
     */
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
   1. SIGNUP
   POST /auth/signup
========================================================= */

router.post("/signup", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    let user = await User.findOne({
      email,
    });

    /*
     * Email already belongs to verified account
     */
    if (user && user.emailVerified) {
      return res.status(409).json({
        success: false,
        message: "Email already registered. Please login.",
      });
    }

    /*
     * Create pending account
     */
    if (!user) {
      user = await User.create({
        email,
        emailVerified: false,
        profileCompleted: false,

        emailOtpHash: null,
        emailOtpExpiresAt: null,
        emailOtpAttempts: 0,
        emailOtpLastSentAt: null,
        emailOtpPurpose: null,
      });
    }

    await createAndSendOtp(user, "signup");

    return res.status(200).json({
      success: true,
      message: "Verification code sent to your email.",
      email,
      expiresIn: OTP_EXPIRY_MINUTES * 60,
      resendAfter: OTP_RESEND_COOLDOWN_SECONDS,
    });
  } catch (error) {
    console.error("SIGNUP OTP ERROR:", error);

    if (error.statusCode === 429) {
      return res.status(429).json({
        success: false,
        message: error.message,
        retryAfter: error.remainingCooldown,
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email already registered.",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to send verification code.",
    });
  }
});

/* =========================================================
   2. VERIFY SIGNUP OTP
   POST /auth/verify-signup
========================================================= */

router.post("/verify-signup", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    const otp = String(req.body.otp || "").trim();

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and verification code are required.",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address.",
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "Verification code must contain 6 digits.",
      });
    }

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Signup session not found. Please request a new code.",
      });
    }

    if (user.emailVerified) {
      return res.status(409).json({
        success: false,
        message: "Email is already verified. Please login.",
      });
    }

    if (user.emailOtpPurpose !== "signup") {
      return res.status(400).json({
        success: false,
        message:
          "This verification code is no longer valid. Please request a new code.",
      });
    }

    if (
      !user.emailOtpExpiresAt ||
      new Date(user.emailOtpExpiresAt).getTime() < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please request a new code.",
      });
    }

    if (user.emailOtpAttempts >= MAX_OTP_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        message: "Too many incorrect attempts. Please request a new code.",
      });
    }

    const submittedOtpHash = hashOtp(otp);

    const isCorrect = safeCompareHash(user.emailOtpHash, submittedOtpHash);

    /*
     * Wrong OTP
     */
    if (!isCorrect) {
      user.emailOtpAttempts += 1;

      await user.save();

      const attemptsRemaining = Math.max(
        0,
        MAX_OTP_ATTEMPTS - user.emailOtpAttempts,
      );

      return res.status(400).json({
        success: false,
        message:
          attemptsRemaining > 0
            ? `Incorrect verification code. ${attemptsRemaining} attempts remaining.`
            : "Too many incorrect attempts. Please request a new code.",
      });
    }

    /*
     * Correct OTP
     */

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
      success: true,
      message: "Email verified successfully. Account created.",
      token,
      user: sanitize(user),
    });
  } catch (error) {
    console.error("VERIFY SIGNUP ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to verify email.",
    });
  }
});

/* =========================================================
   3. RESEND SIGNUP OTP
   POST /auth/resend-signup-otp
========================================================= */

router.post("/resend-signup-otp", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Signup session not found.",
      });
    }

    if (user.emailVerified) {
      return res.status(409).json({
        success: false,
        message: "Email is already verified. Please login.",
      });
    }

    await createAndSendOtp(user, "signup");

    return res.status(200).json({
      success: true,
      message: "A new verification code has been sent.",
      expiresIn: OTP_EXPIRY_MINUTES * 60,
      resendAfter: OTP_RESEND_COOLDOWN_SECONDS,
    });
  } catch (error) {
    console.error("RESEND SIGNUP OTP ERROR:", error);

    if (error.statusCode === 429) {
      return res.status(429).json({
        success: false,
        message: error.message,
        retryAfter: error.remainingCooldown,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to resend verification code.",
    });
  }
});

/* =========================================================
   4. LOGIN
   POST /auth/login
========================================================= */

router.post("/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email || req.body.identifier);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email. Please sign up first.",
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: "Email is not verified. Please complete signup verification.",
      });
    }

    await createAndSendOtp(user, "login");

    return res.status(200).json({
      success: true,
      message: "Login verification code sent to your email.",
      email,
      expiresIn: OTP_EXPIRY_MINUTES * 60,
      resendAfter: OTP_RESEND_COOLDOWN_SECONDS,
    });
  } catch (error) {
    console.error("LOGIN OTP ERROR:", error);

    if (error.statusCode === 429) {
      return res.status(429).json({
        success: false,
        message: error.message,
        retryAfter: error.remainingCooldown,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to send login code.",
    });
  }
});

/* =========================================================
   5. VERIFY LOGIN OTP
   POST /auth/verify-login
========================================================= */

router.post("/verify-login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    const otp = String(req.body.otp || "").trim();

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and verification code are required.",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address.",
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "Verification code must contain 6 digits.",
      });
    }

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email.",
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email first.",
      });
    }

    if (user.emailOtpPurpose !== "login") {
      return res.status(400).json({
        success: false,
        message:
          "This login code is no longer valid. Please request a new code.",
      });
    }

    if (
      !user.emailOtpExpiresAt ||
      new Date(user.emailOtpExpiresAt).getTime() < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "Login code has expired. Please request a new code.",
      });
    }

    if (user.emailOtpAttempts >= MAX_OTP_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        message: "Too many incorrect attempts. Please request a new code.",
      });
    }

    const submittedOtpHash = hashOtp(otp);

    const isCorrect = safeCompareHash(user.emailOtpHash, submittedOtpHash);

    /*
     * Wrong OTP
     */

    if (!isCorrect) {
      user.emailOtpAttempts += 1;

      await user.save();

      const attemptsRemaining = Math.max(
        0,
        MAX_OTP_ATTEMPTS - user.emailOtpAttempts,
      );

      return res.status(400).json({
        success: false,
        message:
          attemptsRemaining > 0
            ? `Incorrect verification code. ${attemptsRemaining} attempts remaining.`
            : "Too many incorrect attempts. Please request a new code.",
      });
    }

    /*
     * Login successful
     */

    user.emailOtpHash = null;
    user.emailOtpExpiresAt = null;
    user.emailOtpAttempts = 0;
    user.emailOtpLastSentAt = null;
    user.emailOtpPurpose = null;

    await user.save();

    const token = signToken(user._id.toString());

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: sanitize(user),
    });
  } catch (error) {
    console.error("VERIFY LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to verify login code.",
    });
  }
});

/* =========================================================
   6. RESEND LOGIN OTP
   POST /auth/resend-login-otp
========================================================= */

router.post("/resend-login-otp", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email.",
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email first.",
      });
    }

    await createAndSendOtp(user, "login");

    return res.status(200).json({
      success: true,
      message: "A new login code has been sent.",
      expiresIn: OTP_EXPIRY_MINUTES * 60,
      resendAfter: OTP_RESEND_COOLDOWN_SECONDS,
    });
  } catch (error) {
    console.error("RESEND LOGIN OTP ERROR:", error);

    if (error.statusCode === 429) {
      return res.status(429).json({
        success: false,
        message: error.message,
        retryAfter: error.remainingCooldown,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to resend login code.",
    });
  }
});

export default router;
