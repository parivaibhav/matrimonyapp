import { Router } from "express";
import multer from "multer";

import User from "../models/User.js";
import { auth } from "../middleware/auth.js";
import cloudinary from "../config/cloudinary.js";

const router = Router();

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
   MULTER
========================================================= */

const storage = multer.memoryStorage();

const upload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed."));
    }

    cb(null, true);
  },
});

/* =========================================================
   CLOUDINARY UPLOAD
========================================================= */

function uploadToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",

        transformation: [
          {
            width: 1200,
            height: 1200,
            crop: "limit",
          },
          {
            quality: "auto",
            fetch_format: "auto",
          },
        ],
      },

      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      },
    );

    stream.end(buffer);
  });
}

/* =========================================================
   CLOUDINARY DELETE
========================================================= */

async function deleteFromCloudinary(publicId) {
  if (!publicId) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("CLOUDINARY DELETE ERROR:", error);
  }
}

/* =========================================================
   GET EDUCATION OPTIONS
========================================================= */

router.get("/options/education", auth, async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      options: EDUCATION_OPTIONS,
    });
  } catch (error) {
    console.error("EDUCATION OPTIONS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Could not load education options.",
    });
  }
});

/* =========================================================
   GET ALL PROFILES
========================================================= */

router.get("/", auth, async (req, res) => {
  try {
    const { gender, search, location, education, occupation } = req.query;

    const filter = {
      _id: {
        $ne: req.userId,
      },

      profileCompleted: true,
    };

    if (gender && ["Male", "Female"].includes(gender)) {
      filter.gender = gender;
    }

    if (search?.trim()) {
      filter.fullName = {
        $regex: search.trim(),
        $options: "i",
      };
    }

    if (location?.trim()) {
      filter.location = {
        $regex: location.trim(),
        $options: "i",
      };
    }

    if (education?.trim() && EDUCATION_OPTIONS.includes(education.trim())) {
      filter.education = education.trim();
    }

    if (occupation?.trim()) {
      filter.occupation = {
        $regex: occupation.trim(),
        $options: "i",
      };
    }

    const users = await User.find(filter)
      .select("-password -passwordHash")
      .sort({
        createdAt: -1,
      })
      .limit(50)
      .lean();

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("LOAD PROFILES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Could not load profiles.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/* =========================================================
   GET CURRENT USER
========================================================= */

router.get("/me/current", auth, async (req, res) => {
  try {
    console.log("GET CURRENT USER - AUTH USER ID:", req.userId);

    const user = await User.findById(req.userId)
      .select("-password -passwordHash")
      .lean();

    if (!user) {
      console.error("GET CURRENT USER - USER NOT FOUND:", req.userId);

      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("LOAD CURRENT USER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Could not load user profile.",
    });
  }
});

/* =========================================================
   UPDATE CURRENT USER PROFILE
========================================================= */

router.put("/me", auth, async (req, res) => {
  try {
    console.log("======================================");
    console.log("PROFILE UPDATE");
    console.log("AUTH USER ID:", req.userId);
    console.log("REQUEST BODY:", req.body);
    console.log("======================================");

    /*
     * Make sure authentication actually supplied an ID.
     */
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication user ID is missing.",
      });
    }

    /*
     * Check that the authenticated user actually exists.
     */
    const existingUser = await User.findById(req.userId);

    if (!existingUser) {
      console.error("PROFILE UPDATE USER NOT FOUND:", req.userId);

      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const {
      fullName,
      dob,
      gender,
      location,
      education,
      occupation,
      height,
      weight,
      fatherName,
      fatherMobile,
      motherName,
      interests,
    } = req.body;

    /* =====================================================
       BASIC VALIDATION
    ===================================================== */

    if (!fullName?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Full name is required.",
      });
    }

    if (!dob) {
      return res.status(400).json({
        success: false,
        message: "Date of birth is required.",
      });
    }

    const parsedDob = new Date(dob);

    if (Number.isNaN(parsedDob.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid date of birth.",
      });
    }

    if (parsedDob > new Date()) {
      return res.status(400).json({
        success: false,
        message: "Date of birth cannot be in the future.",
      });
    }

    if (!gender || !["Male", "Female"].includes(gender)) {
      return res.status(400).json({
        success: false,
        message: "Valid gender is required.",
      });
    }

    if (!location?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Location is required.",
      });
    }

    if (education && !EDUCATION_OPTIONS.includes(education.trim())) {
      return res.status(400).json({
        success: false,
        message: "Invalid education selected.",
      });
    }

    /* =====================================================
       INTERESTS
    ===================================================== */

    let interestsArray = [];

    if (Array.isArray(interests)) {
      interestsArray = [
        ...new Set(
          interests.map((item) => String(item).trim()).filter(Boolean),
        ),
      ];
    } else if (typeof interests === "string") {
      try {
        const parsedInterests = JSON.parse(interests);

        if (Array.isArray(parsedInterests)) {
          interestsArray = [
            ...new Set(
              parsedInterests
                .map((item) => String(item).trim())
                .filter(Boolean),
            ),
          ];
        }
      } catch {
        interestsArray = [
          ...new Set(
            interests
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
          ),
        ];
      }
    }

    /* =====================================================
       UPDATE
    ===================================================== */

    existingUser.fullName = fullName.trim();
    existingUser.dob = parsedDob;
    existingUser.gender = gender;
    existingUser.location = location.trim();
    existingUser.education = education?.trim() || "";
    existingUser.occupation = occupation?.trim() || "";
    existingUser.height = height?.trim() || "";
    existingUser.weight = weight?.trim() || "";
    existingUser.fatherName = fatherName?.trim() || "";
    existingUser.fatherMobile = fatherMobile?.trim() || "";
    existingUser.motherName = motherName?.trim() || "";
    existingUser.interests = interestsArray;

    /*
     * IMPORTANT
     */
    existingUser.profileCompleted = true;

    await existingUser.save();

    const updatedUser = await User.findById(req.userId)
      .select("-password -passwordHash")
      .lean();

    console.log("PROFILE UPDATE SUCCESS:", updatedUser?._id);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("PROFILE UPDATE ERROR:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update profile.",
    });
  }
});

/* =========================================================
   UPLOAD PROFILE PHOTO
========================================================= */

router.post("/me/photo", auth, upload.single("photo"), async (req, res) => {
  try {
    console.log("PHOTO UPLOAD AUTH USER ID:", req.userId);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No photo file provided.",
      });
    }

    const currentUser = await User.findById(req.userId);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const result = await uploadToCloudinary(
      req.file.buffer,
      "matrimony/profile-photos",
    );

    const oldPublicId = currentUser.profilePhotoPublicId;

    currentUser.profilePhoto = result.secure_url;

    currentUser.profilePhotoPublicId = result.public_id;

    await currentUser.save();

    if (oldPublicId) {
      await deleteFromCloudinary(oldPublicId);
    }

    const updatedUser = await User.findById(req.userId)
      .select("-password -passwordHash")
      .lean();

    return res.status(200).json({
      success: true,
      message: "Profile photo uploaded successfully.",
      profilePhoto: result.secure_url,
      user: updatedUser,
    });
  } catch (error) {
    console.error("PHOTO UPLOAD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to upload profile photo.",
    });
  }
});

/* =========================================================
   DELETE PROFILE PHOTO
========================================================= */

router.delete("/me/photo", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.profilePhotoPublicId) {
      await deleteFromCloudinary(user.profilePhotoPublicId);
    }

    user.profilePhoto = "";
    user.profilePhotoPublicId = "";

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile photo removed successfully.",
    });
  } catch (error) {
    console.error("PHOTO DELETE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to remove profile photo.",
    });
  }
});

/* =========================================================
   GET PROFILE BY ID
========================================================= */

router.get("/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password -passwordHash")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);

    return res.status(400).json({
      success: false,
      message: "Invalid profile id.",
    });
  }
});

export default router;
