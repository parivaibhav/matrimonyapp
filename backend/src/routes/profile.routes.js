import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import User, { DASHANAM_OPTIONS } from "../models/User.js";
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
   EDUCATION OPTIONS
========================================================= */

const EDUCATION_OPTIONS = [
  "10th",
  "12th",
  "Diploma",
  "ITI",
  "B.A.",
  "B.Com.",
  "B.Sc.",
  "BBA",
  "BCA",
  "B.Tech",
  "B.E.",
  "MBBS",
  "BDS",
  "LLB",
  "B.Pharm",
  "M.A.",
  "M.Com.",
  "M.Sc.",
  "MBA",
  "MCA",
  "M.Tech",
  "M.E.",
  "MD",
  "MS",
  "LLM",
  "PhD",
  "Other",
];

/* =========================================================
   GET EDUCATION OPTIONS
========================================================= */

router.get("/options/education", auth, async (req, res) => {
  try {
    return res.json({
      options: EDUCATION_OPTIONS,
    });
  } catch (error) {
    console.error("EDUCATION OPTIONS ERROR:", error);

    return res.status(500).json({
      message: "Could not load education options",
    });
  }
});

/* =========================================================
   GET DASHANAM OPTIONS
========================================================= */

router.get("/options/dasha-nam", auth, async (req, res) => {
  try {
    return res.json({
      options: DASHANAM_OPTIONS,
    });
  } catch (error) {
    console.error("DASHANAM OPTIONS ERROR:", error);

    return res.status(500).json({
      message: "Could not load Dasha Nam options",
    });
  }
});

/* =========================================================
   GET ALL PROFILES
========================================================= */

router.get("/", auth, async (req, res) => {
  try {
    const { gender, search, city, dashaNam } = req.query;

    const filter = {
      _id: {
        $ne: req.userId,
      },

      profileCompleted: true,
    };

    /* -------------------------------------------------------
       GENDER
    ------------------------------------------------------- */

    if (gender && ["Male", "Female"].includes(gender)) {
      filter.gender = gender;
    }

    /* -------------------------------------------------------
       NAME SEARCH
    ------------------------------------------------------- */

    if (search) {
      filter.fullName = {
        $regex: search,
        $options: "i",
      };
    }

    /* -------------------------------------------------------
       CITY
    ------------------------------------------------------- */

    if (city) {
      filter.city = {
        $regex: city,
        $options: "i",
      };
    }

    /* -------------------------------------------------------
       DASHANAM
    ------------------------------------------------------- */

    if (dashaNam && DASHANAM_OPTIONS.includes(dashaNam)) {
      filter.dashaNam = dashaNam;
    }

    /* -------------------------------------------------------
       GET USERS
    ------------------------------------------------------- */

    const users = await User.find(filter)
      .select("-passwordHash")
      .sort({
        createdAt: -1,
      })
      .limit(50);

    return res.json(users);
  } catch (error) {
    console.error("LOAD PROFILES ERROR:", error);

    return res.status(500).json({
      message: "Could not load profiles",
    });
  }
});

/* =========================================================
   GET CURRENT USER
========================================================= */

router.get("/me/current", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-passwordHash");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.json(user);
  } catch (error) {
    console.error("LOAD CURRENT USER ERROR:", error);

    return res.status(500).json({
      message: "Could not load user profile",
    });
  }
});

/* =========================================================
   UPDATE CURRENT PROFILE
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
      dashaNam,
      fatherName,
      motherName,
      fatherMobile,
      bio,
      familyDetails,
      interests,
    } = req.body;

    /* -----------------------------------------------------
         FULL NAME
      ----------------------------------------------------- */

    if (!fullName?.trim()) {
      return res.status(400).json({
        message: "Full name is required.",
      });
    }

    /* -----------------------------------------------------
         AGE
      ----------------------------------------------------- */

    if (age === undefined || age === null || age === "") {
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

    /* -----------------------------------------------------
         GENDER
      ----------------------------------------------------- */

    if (!gender || !["Male", "Female"].includes(gender)) {
      return res.status(400).json({
        message: "Valid gender is required.",
      });
    }

    /* -----------------------------------------------------
         PHONE
      ----------------------------------------------------- */

    if (!phone?.trim()) {
      return res.status(400).json({
        message: "Phone number is required.",
      });
    }

    /* -----------------------------------------------------
         PHONE DUPLICATE CHECK
      ----------------------------------------------------- */

    const cleanPhone = phone.trim();

    const existingPhone = await User.findOne({
      phone: cleanPhone,
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
         EDUCATION
      ----------------------------------------------------- */

    if (education && !EDUCATION_OPTIONS.includes(education)) {
      return res.status(400).json({
        message: "Invalid education selected.",
      });
    }

    /* -----------------------------------------------------
         DASHANAM
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
         UPDATE DATA
      ----------------------------------------------------- */

    const updates = {
      fullName: fullName.trim(),

      age: numericAge,

      gender,

      phone: cleanPhone,

      education: education?.trim() || "",

      occupation: occupation?.trim() || "",

      city: city?.trim() || "",

      height: height?.trim() || "",

      dashaNam: dashaNam?.trim() || "",

      fatherName: fatherName?.trim() || "",

      motherName: motherName?.trim() || "",

      fatherMobile: fatherMobile?.trim() || "",

      familyDetails: familyDetails?.trim() || "",

      bio: bio?.trim() || "",

      interests: interestsArray,

      profileCompleted: true,
    };

    /* -----------------------------------------------------
         SAVE
      ----------------------------------------------------- */

    const updatedUser = await User.findByIdAndUpdate(req.userId, updates, {
      new: true,
      runValidators: true,
    }).select("-passwordHash");

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.json({
      message: "Profile updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("PROFILE UPDATE ERROR:", error);

    return res.status(400).json({
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

    return res.json({
      message: "Profile photo uploaded successfully.",

      profilePhoto: photoRelativePath,

      user: updatedUser,
    });
  } catch (error) {
    console.error("PHOTO UPLOAD ERROR:", error);

    return res.status(500).json({
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

    return res.json({
      message: "Biodata document uploaded successfully.",

      biodataUrl: biodataRelativePath,

      user: updatedUser,
    });
  } catch (error) {
    console.error("BIODATA UPLOAD ERROR:", error);

    return res.status(500).json({
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

    return res.json(user);
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);

    return res.status(400).json({
      message: "Invalid profile id",
    });
  }
});

export default router;
