import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import User from "../models/User.js";
import { auth } from "../middleware/auth.js";

const router = Router();

/* =========================================================
   PATHS
========================================================= */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, "../../uploads");

fs.mkdirSync(uploadsDir, {
  recursive: true,
});

/* =========================================================
   MULTER
========================================================= */

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

  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

/* =========================================================
   CONSTANTS
========================================================= */

const DASHANAM_OPTIONS = [
  "Giri",
  "Puri",
  "Bharati",
  "Ashram",
  "Saraswati",
  "Aranya",
  "Van",
  "Parvat",
  "Sagar",
  "Tirtha",
  "Gosai",
];

const EDUCATION_OPTIONS = [
  "10th",
  "12th",
  "Diploma",
  "B.A.",
  "B.Com",
  "B.Sc.",
  "B.B.A.",
  "B.C.A.",
  "B.Tech",
  "B.E.",
  "LLB",
  "MBBS",
  "BDS",
  "B.Pharm",
  "M.A.",
  "M.Com",
  "M.Sc.",
  "M.B.A.",
  "M.C.A.",
  "M.Tech",
  "M.E.",
  "LLM",
  "MD",
  "PhD",
  "Other",
];

/* =========================================================
   GET EDUCATION OPTIONS
   Used by React Native autocomplete/dropdown
========================================================= */

router.get("/options/education", auth, async (req, res) => {
  try {
    res.json({
      options: EDUCATION_OPTIONS,
    });
  } catch {
    res.status(500).json({
      message: "Could not load education options",
    });
  }
});

/* =========================================================
   GET DASHANAM OPTIONS
========================================================= */

router.get("/options/dasha-nam", auth, async (req, res) => {
  try {
    res.json({
      options: DASHANAM_OPTIONS,
    });
  } catch {
    res.status(500).json({
      message: "Could not load Dasha Nam options",
    });
  }
});

/* =========================================================
   GET ALL PROFILES
   Discover / Search
========================================================= */

router.get("/", auth, async (req, res) => {
  try {
    const { gender, search, city, religion, community } = req.query;

    const filter = {
      _id: {
        $ne: req.userId,
      },

      // Only show completed profiles
      profileCompleted: true,
    };

    if (gender && ["Male", "Female"].includes(gender)) {
      filter.gender = gender;
    }

    if (search) {
      filter.fullName = {
        $regex: search,
        $options: "i",
      };
    }

    if (city) {
      filter.city = {
        $regex: city,
        $options: "i",
      };
    }

    if (religion) {
      filter.religion = {
        $regex: religion,
        $options: "i",
      };
    }

    if (community) {
      filter.community = {
        $regex: community,
        $options: "i",
      };
    }

    const users = await User.find(filter)
      .select("-passwordHash")
      .sort({
        createdAt: -1,
      })
      .limit(50);

    res.json(users);
  } catch (error) {
    console.error("LOAD PROFILES ERROR:", error);

    res.status(500).json({
      message: "Could not load profiles",
    });
  }
});

/* =========================================================
   GET CURRENT LOGGED-IN USER
========================================================= */

router.get("/me/current", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-passwordHash");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(user);
  } catch (error) {
    console.error("LOAD CURRENT USER ERROR:", error);

    res.status(500).json({
      message: "Could not load user profile",
    });
  }
});

/* =========================================================
   UPDATE / COMPLETE CURRENT PROFILE
========================================================= */

router.put("/me", auth, async (req, res) => {
  try {
    const {
      fullName,
      age,
      gender,
      phone,
      education,
      occupation,
      city,
      height,
      religion,
      dashaNam,
      community,
      fatherName,
      motherName,
      fatherMobile,
      bio,
      familyDetails,
      interests,
    } = req.body;

    /* -----------------------------------------------------
       REQUIRED PROFILE FIELDS
    ----------------------------------------------------- */

    if (!fullName?.trim()) {
      return res.status(400).json({
        message: "Full name is required.",
      });
    }

    if (!age) {
      return res.status(400).json({
        message: "Age is required.",
      });
    }

    const numericAge = Number(age);

    if (Number.isNaN(numericAge) || numericAge < 18) {
      return res.status(400).json({
        message: "Age must be a valid number and at least 18.",
      });
    }

    if (!gender || !["Male", "Female"].includes(gender)) {
      return res.status(400).json({
        message: "Valid gender is required.",
      });
    }

    if (!phone?.trim()) {
      return res.status(400).json({
        message: "Phone number is required.",
      });
    }

    /* -----------------------------------------------------
       PHONE CHECK
    ----------------------------------------------------- */

    const existingPhone = await User.findOne({
      phone: phone.trim(),
      _id: {
        $ne: req.userId,
      },
    });

    if (existingPhone) {
      return res.status(409).json({
        message: "This phone number is already registered.",
      });
    }

    /* -----------------------------------------------------
       DASHANAM VALIDATION
    ----------------------------------------------------- */

    if (dashaNam && !DASHANAM_OPTIONS.includes(dashaNam)) {
      return res.status(400).json({
        message: "Invalid Dasha Nam selected.",
      });
    }

    /* -----------------------------------------------------
       INTERESTS
    ----------------------------------------------------- */

    let interestsArray = [];

    if (Array.isArray(interests)) {
      interestsArray = interests
        .map((item) => String(item).trim())
        .filter(Boolean);
    } else if (typeof interests === "string") {
      interestsArray = interests
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }

    /* -----------------------------------------------------
       UPDATE
    ----------------------------------------------------- */

    const updates = {
      fullName: fullName.trim(),
      age: numericAge,
      gender,
      phone: phone.trim(),

      education: education?.trim() || "",

      occupation: occupation?.trim() || "",

      city: city?.trim() || "",

      height: height?.trim() || "",

      religion: religion?.trim() || "",

      dashaNam: dashaNam || "",

      community: community?.trim() || "",

      fatherName: fatherName?.trim() || "",

      motherName: motherName?.trim() || "",

      fatherMobile: fatherMobile?.trim() || "",

      bio: bio?.trim() || "",

      familyDetails: familyDetails?.trim() || "",

      interests: interestsArray,

      profileCompleted: true,
    };

    const updatedUser = await User.findByIdAndUpdate(req.userId, updates, {
      new: true,
      runValidators: true,
    }).select("-passwordHash");

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    res.json({
      message: "Profile completed successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("PROFILE UPDATE ERROR:", error);

    res.status(400).json({
      message: error.message || "Failed to update profile",
    });
  }
});

/* =========================================================
   UPLOAD PROFILE PHOTO
========================================================= */

router.post("/me/photo", auth, upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No photo file provided.",
      });
    }

    const photoRelativePath = `/uploads/${req.file.filename}`;

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      {
        profilePhoto: photoRelativePath,
      },
      {
        new: true,
      },
    ).select("-passwordHash");

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    res.json({
      message: "Profile photo uploaded successfully.",
      profilePhoto: photoRelativePath,
      user: updatedUser,
    });
  } catch (error) {
    console.error("PHOTO UPLOAD ERROR:", error);

    res.status(500).json({
      message: "Failed to upload profile photo",
    });
  }
});

/* =========================================================
   UPLOAD BIODATA
========================================================= */

router.post("/me/biodata", auth, upload.single("biodata"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No biodata file provided.",
      });
    }

    const biodataRelativePath = `/uploads/${req.file.filename}`;

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      {
        biodataUrl: biodataRelativePath,
      },
      {
        new: true,
      },
    ).select("-passwordHash");

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    res.json({
      message: "Biodata document uploaded successfully.",
      biodataUrl: biodataRelativePath,
      user: updatedUser,
    });
  } catch (error) {
    console.error("BIODATA UPLOAD ERROR:", error);

    res.status(500).json({
      message: "Failed to upload biodata",
    });
  }
});

/* =========================================================
   GET SINGLE PROFILE
========================================================= */

router.get("/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-passwordHash");

    if (!user) {
      return res.status(404).json({
        message: "Profile not found",
      });
    }

    res.json(user);
  } catch (error) {
    res.status(400).json({
      message: "Invalid profile id",
    });
  }
});

export default router;
