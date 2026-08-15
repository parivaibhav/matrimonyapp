import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import User from "../models/User.js";

const router = Router();

const uploadDir = path.resolve("uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname || ".jpg");
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

router.post("/signup", upload.single("profilePhoto"), async (req, res) => {
  try {
    const {
      fullName, gender, age, phone, email, password,
      education, occupation, city, height, religion,
      community, bio, familyDetails, interests
    } = req.body;

    if (!fullName || !gender || !age || !phone || !email || !password) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    const exists = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { phone }]
    });

    if (exists) {
      return res.status(409).json({ message: "Email or phone already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      fullName,
      gender,
      age: Number(age),
      phone,
      email: email.toLowerCase(),
      passwordHash,
      education,
      occupation,
      city,
      height,
      religion,
      community,
      bio,
      familyDetails,
      interests: typeof interests === "string"
        ? interests.split(",").map(x => x.trim()).filter(Boolean)
        : [],
      profilePhoto: req.file ? `/uploads/${req.file.filename}` : ""
    });

    const token = signToken(user._id.toString());

    res.status(201).json({
      token,
      user: sanitize(user)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Signup failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    const user = await User.findOne({
      $or: [
        { email: String(identifier).toLowerCase() },
        { phone: identifier }
      ]
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Invalid email/phone or password" });
    }

    res.json({
      token: signToken(user._id.toString()),
      user: sanitize(user)
    });
  } catch {
    res.status(500).json({ message: "Login failed" });
  }
});

function sanitize(user) {
  const obj = user.toObject ? user.toObject() : user;
  delete obj.passwordHash;
  return obj;
}

export default router;
