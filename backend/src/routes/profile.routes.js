import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import User from "../models/User.js";
import { auth } from "../middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, "../../uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || ".jpg";
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const router = Router();

// GET all profiles (discover/search)
router.get("/", auth, async (req, res) => {
  try {
    const { gender, search } = req.query;

    const filter = { _id: { $ne: req.userId } };
    if (gender && ["Male", "Female"].includes(gender)) filter.gender = gender;

    if (search) {
      filter.fullName = { $regex: search, $options: "i" };
    }

    const users = await User.find(filter)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(users);
  } catch {
    res.status(500).json({ message: "Could not load profiles" });
  }
});

// GET current logged-in user profile
router.get("/me/current", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch {
    res.status(500).json({ message: "Could not load user profile" });
  }
});

// UPDATE current user profile details
router.put("/me", auth, async (req, res) => {
  try {
    const allowedFields = [
      "fullName",
      "age",
      "gender",
      "phone",
      "education",
      "occupation",
      "city",
      "height",
      "religion",
      "community",
      "bio",
      "familyDetails",
      "interests",
    ];

    const updates = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const updatedUser = await User.findByIdAndUpdate(req.userId, updates, {
      new: true,
      runValidators: true,
    }).select("-passwordHash");

    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: error.message || "Failed to update profile" });
  }
});

// UPLOAD profile photo
router.post("/me/photo", auth, upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No photo file provided" });
    }

    const photoRelativePath = `/uploads/${req.file.filename}`;

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { profilePhoto: photoRelativePath },
      { new: true }
    ).select("-passwordHash");

    res.json({
      message: "Profile photo uploaded successfully",
      profilePhoto: photoRelativePath,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Photo upload error:", error);
    res.status(500).json({ message: "Failed to upload profile photo" });
  }
});

// UPLOAD biodata document/file
router.post("/me/biodata", auth, upload.single("biodata"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No biodata file provided" });
    }

    const biodataRelativePath = `/uploads/${req.file.filename}`;

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { biodataUrl: biodataRelativePath },
      { new: true }
    ).select("-passwordHash");

    res.json({
      message: "Biodata document uploaded successfully",
      biodataUrl: biodataRelativePath,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Biodata upload error:", error);
    res.status(500).json({ message: "Failed to upload biodata" });
  }
});

// GET single profile by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "Profile not found" });
    res.json(user);
  } catch {
    res.status(400).json({ message: "Invalid profile id" });
  }
});

export default router;
