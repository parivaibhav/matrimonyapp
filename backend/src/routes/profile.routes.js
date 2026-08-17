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

    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + ext,
    );
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
   GET /profiles/options/education
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
   GET ALL PROFILES
   GET /profiles
========================================================= */

router.get("/", auth, async (req, res) => {
  try {
    const {
      gender,
      search,
      city,
    } = req.query;

    console.log("======================================");
    console.log("GET /profiles");
    console.log("Logged in user:", req.userId);
    console.log("Query:", req.query);
    console.log("======================================");

    /* -------------------------------------------------------
       BASE FILTER
    ------------------------------------------------------- */

    const filter = {
      _id: {
        $ne: req.userId,
      },
    };

    /* -------------------------------------------------------
       PROFILE COMPLETION FILTER

       Visible when:
       - profileCompleted === true
       OR
       - profileCompleted does not exist

       This supports old users.
    ------------------------------------------------------- */

    filter.$or = [
      {
        profileCompleted: true,
      },
      {
        profileCompleted: {
          $exists: false,
        },
      },
    ];

    /* -------------------------------------------------------
       GENDER
    ------------------------------------------------------- */

    if (gender && ["Male", "Female"].includes(gender)) {
      filter.gender = gender;
    }

    /* -------------------------------------------------------
       NAME SEARCH
    ------------------------------------------------------- */

    if (search?.trim()) {
      filter.fullName = {
        $regex: search.trim(),
        $options: "i",
      };
    }

    /* -------------------------------------------------------
       CITY
    ------------------------------------------------------- */

    if (city?.trim()) {
      filter.city = {
        $regex: city.trim(),
        $options: "i",
      };
    }

    /* -------------------------------------------------------
       DEBUG DATABASE COUNT
    ------------------------------------------------------- */

    const totalUsers = await User.countDocuments();

    console.log(
      "TOTAL USERS IN DATABASE:",
      totalUsers,
    );

    const usersWithoutCurrentUser =
      await User.countDocuments({
        _id: {
          $ne: req.userId,
        },
      });

    console.log(
      "USERS EXCLUDING CURRENT USER:",
      usersWithoutCurrentUser,
    );

    const completedUsers =
      await User.countDocuments({
        _id: {
          $ne: req.userId,
        },
        profileCompleted: true,
      });

    console.log(
      "COMPLETED USERS:",
      completedUsers,
    );

    /* -------------------------------------------------------
       GET USERS
    ------------------------------------------------------- */

    const users = await User.find(filter)
      .select("-passwordHash")
      .sort({
        createdAt: -1,
      })
      .limit(50)
      .lean();

    console.log(
      "VISIBLE PROFILES:",
      users.length,
    );

    console.log(
      "VISIBLE PROFILE IDS:",
      users.map((user) => user._id),
    );

    /* -------------------------------------------------------
       RESPONSE
    ------------------------------------------------------- */

    return res.json(users);
  } catch (error) {
    console.error("LOAD PROFILES ERROR:", error);

    return res.status(500).json({
      message: "Could not load profiles",

      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
});

/* =========================================================
   GET CURRENT USER
   GET /profiles/me/current
========================================================= */

router.get("/me/current", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select("-passwordHash");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.json(user);
  } catch (error) {
    console.error(
      "LOAD CURRENT USER ERROR:",
      error,
    );

    return res.status(500).json({
      message: "Could not load user profile",
    });
  }
});

/* =========================================================
   UPDATE CURRENT PROFILE
   PUT /profiles/me
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
      fatherName,
      motherName,
      fatherMobile,
      bio,
      familyDetails,
      interests,
    } = req.body;

    /* -------------------------------------------------------
       FULL NAME
    ------------------------------------------------------- */

    if (!fullName?.trim()) {
      return res.status(400).json({
        message: "Full name is required.",
      });
    }

    /* -------------------------------------------------------
       AGE
    ------------------------------------------------------- */

    if (
      age === undefined ||
      age === null ||
      age === ""
    ) {
      return res.status(400).json({
        message: "Age is required.",
      });
    }

    const numericAge = Number(age);

    if (
      Number.isNaN(numericAge) ||
      numericAge < 18
    ) {
      return res.status(400).json({
        message:
          "Age must be a valid number and at least 18.",
      });
    }

    /* -------------------------------------------------------
       GENDER
    ------------------------------------------------------- */

    if (
      !gender ||
      !["Male", "Female"].includes(gender)
    ) {
      return res.status(400).json({
        message: "Valid gender is required.",
      });
    }

    /* -------------------------------------------------------
       PHONE
    ------------------------------------------------------- */

    if (!phone?.trim()) {
      return res.status(400).json({
        message: "Phone number is required.",
      });
    }

    const cleanPhone = phone.trim();

    /* -------------------------------------------------------
       PHONE DUPLICATE CHECK
    ------------------------------------------------------- */

    const existingPhone = await User.findOne({
      phone: cleanPhone,

      _id: {
        $ne: req.userId,
      },
    });

    if (existingPhone) {
      return res.status(409).json({
        message:
          "This phone number is already registered.",
      });
    }

    /* -------------------------------------------------------
       EDUCATION
    ------------------------------------------------------- */

    if (
      education &&
      !EDUCATION_OPTIONS.includes(education)
    ) {
      return res.status(400).json({
        message: "Invalid education selected.",
      });
    }

    /* -------------------------------------------------------
       INTERESTS
    ------------------------------------------------------- */

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

    /* -------------------------------------------------------
       UPDATE DATA
    ------------------------------------------------------- */

    const updates = {
      fullName: fullName.trim(),

      age: numericAge,

      gender,

      phone: cleanPhone,

      education:
        education?.trim() || "",

      occupation:
        occupation?.trim() || "",

      city:
        city?.trim() || "",

      height:
        height?.trim() || "",

      fatherName:
        fatherName?.trim() || "",

      motherName:
        motherName?.trim() || "",

      fatherMobile:
        fatherMobile?.trim() || "",

      familyDetails:
        familyDetails?.trim() || "",

      bio:
        bio?.trim() || "",

      interests: interestsArray,

      profileCompleted: true,
    };

    /* -------------------------------------------------------
       SAVE
    ------------------------------------------------------- */

    const updatedUser =
      await User.findByIdAndUpdate(
        req.userId,
        updates,
        {
          new: true,
          runValidators: true,
        },
      ).select("-passwordHash");

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    console.log(
      "PROFILE UPDATED:",
      updatedUser._id,
    );

    console.log(
      "PROFILE COMPLETED:",
      updatedUser.profileCompleted,
    );

    return res.json({
      message:
        "Profile updated successfully.",

      user: updatedUser,
    });
  } catch (error) {
    console.error(
      "PROFILE UPDATE ERROR:",
      error,
    );

    return res.status(400).json({
      message:
        error.message ||
        "Failed to update profile",
    });
  }
});

/* =========================================================
   UPLOAD PROFILE PHOTO
   POST /profiles/me/photo
========================================================= */

router.post(
  "/me/photo",
  auth,
  upload.single("photo"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "No photo file provided.",
        });
      }

      const photoRelativePath =
        `/uploads/${req.file.filename}`;

      const updatedUser =
        await User.findByIdAndUpdate(
          req.userId,
          {
            profilePhoto:
              photoRelativePath,
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
        message:
          "Profile photo uploaded successfully.",

        profilePhoto:
          photoRelativePath,

        user: updatedUser,
      });
    } catch (error) {
      console.error(
        "PHOTO UPLOAD ERROR:",
        error,
      );

      return res.status(500).json({
        message:
          "Failed to upload profile photo",
      });
    }
  },
);

/* =========================================================
   UPLOAD BIODATA
   POST /profiles/me/biodata
========================================================= */

router.post(
  "/me/biodata",
  auth,
  upload.single("biodata"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message:
            "No biodata file provided.",
        });
      }

      const biodataRelativePath =
        `/uploads/${req.file.filename}`;

      const updatedUser =
        await User.findByIdAndUpdate(
          req.userId,
          {
            biodataUrl:
              biodataRelativePath,
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
        message:
          "Biodata document uploaded successfully.",

        biodataUrl:
          biodataRelativePath,

        user: updatedUser,
      });
    } catch (error) {
      console.error(
        "BIODATA UPLOAD ERROR:",
        error,
      );

      return res.status(500).json({
        message:
          "Failed to upload biodata",
      });
    }
  },
);

/* =========================================================
   GET SINGLE PROFILE
   GET /profiles/:id
========================================================= */

router.get("/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(
      req.params.id,
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({
        message: "Profile not found",
      });
    }

    return res.json(user);
  } catch (error) {
    console.error(
      "GET PROFILE ERROR:",
      error,
    );

    return res.status(400).json({
      message: "Invalid profile id",
    });
  }
});

export default router;