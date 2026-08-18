import { Router } from "express";
import multer from "multer";

import User from "../models/User.js";
import { auth } from "../middleware/auth.js";
import cloudinary from "../config/cloudinary.js";

const router = Router();

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
      .select("-password")
      .sort({
        createdAt: -1,
      })
      .limit(50)
      .lean();

    return res.json(users);
  } catch (error) {
    console.error("LOAD PROFILES ERROR:", error);

    return res.status(500).json({
      message: "Could not load profiles",

      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.get("/me/current", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password").lean();

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

router.put("/me", auth, async (req, res) => {
  try {
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

    if (!fullName?.trim()) {
      return res.status(400).json({
        message: "Full name is required.",
      });
    }

    if (!dob) {
      return res.status(400).json({
        message: "Date of birth is required.",
      });
    }

    const parsedDob = new Date(dob);

    if (Number.isNaN(parsedDob.getTime())) {
      return res.status(400).json({
        message: "Please provide a valid date of birth.",
      });
    }

    if (parsedDob > new Date()) {
      return res.status(400).json({
        message: "Date of birth cannot be in the future.",
      });
    }

    if (!gender || !["Male", "Female"].includes(gender)) {
      return res.status(400).json({
        message: "Valid gender is required.",
      });
    }

    if (!location?.trim()) {
      return res.status(400).json({
        message: "Location is required.",
      });
    }

    if (education && !EDUCATION_OPTIONS.includes(education)) {
      return res.status(400).json({
        message: "Invalid education selected.",
      });
    }

    let interestsArray = [];

    if (Array.isArray(interests)) {
      interestsArray = [
        ...new Set(
          interests.map((item) => String(item).trim()).filter(Boolean),
        ),
      ];
    } else if (typeof interests === "string") {
      interestsArray = [
        ...new Set(
          interests
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        ),
      ];
    }

    const updates = {
      fullName: fullName.trim(),

      dob: parsedDob,

      gender,

      location: location.trim(),

      education: education?.trim() || "",

      occupation: occupation?.trim() || "",

      height: height?.trim() || "",

      weight: weight?.trim() || "",

      fatherName: fatherName?.trim() || "",

      fatherMobile: fatherMobile?.trim() || "",

      motherName: motherName?.trim() || "",

      interests: interestsArray,

      profileCompleted: true,
    };

    const updatedUser = await User.findByIdAndUpdate(req.userId, updates, {
      new: true,
      runValidators: true,
    })
      .select("-password")
      .lean();

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

router.post("/me/photo", auth, upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No photo file provided.",
      });
    }

    const currentUser = await User.findById(req.userId);

    if (!currentUser) {
      return res.status(404).json({
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
      .select("-password")
      .lean();

    return res.json({
      message: "Profile photo uploaded successfully.",

      profilePhoto: result.secure_url,

      user: updatedUser,
    });
  } catch (error) {
    console.error("PHOTO UPLOAD ERROR:", error);

    return res.status(500).json({
      message: error.message || "Failed to upload profile photo",
    });
  }
});

router.delete("/me/photo", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    if (user.profilePhotoPublicId) {
      await deleteFromCloudinary(user.profilePhotoPublicId);
    }

    user.profilePhoto = "";
    user.profilePhotoPublicId = "";

    await user.save();

    return res.json({
      message: "Profile photo removed successfully.",
    });
  } catch (error) {
    console.error("PHOTO DELETE ERROR:", error);

    return res.status(500).json({
      message: "Failed to remove profile photo",
    });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password").lean();

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
