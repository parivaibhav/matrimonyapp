import mongoose from "mongoose";

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

const OTP_PURPOSES = ["signup", "login"];

/* =========================================================
   USER SCHEMA
========================================================= */

const userSchema = new mongoose.Schema(
  {
    // =======================================================
    // ACCOUNT
    // =======================================================

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    emailVerified: {
      type: Boolean,
      default: false,
      index: true,
    },

    // =======================================================
    // OTP
    // =======================================================

    emailOtpHash: {
      type: String,
      default: null,
    },

    emailOtpExpiresAt: {
      type: Date,
      default: null,
    },

    emailOtpAttempts: {
      type: Number,
      default: 0,
    },

    emailOtpLastSentAt: {
      type: Date,
      default: null,
    },

    emailOtpPurpose: {
      type: String,
      enum: OTP_PURPOSES,
      default: null,
    },

    // =======================================================
    // PROFILE
    // =======================================================

    profilePhoto: {
      type: String,
      default: "",
      trim: true,
    },

    fullName: {
      type: String,
      default: "",
      trim: true,
    },

    gender: {
      type: String,
      enum: ["Male", "Female"],
      trim: true,
    },

    age: {
      type: Number,
      min: 18,
      default: null,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    education: {
      type: String,
      default: "",
      trim: true,
    },

    occupation: {
      type: String,
      default: "",
      trim: true,
    },

    city: {
      type: String,
      default: "",
      trim: true,
    },

    height: {
      type: String,
      default: "",
      trim: true,
    },

    // =======================================================
    // DASHANAMI
    // =======================================================

    dashaNam: {
      type: String,
      enum: DASHANAM_OPTIONS,
      trim: true,
    },

    // =======================================================
    // FAMILY
    // =======================================================

    fatherName: {
      type: String,
      default: "",
      trim: true,
    },

    motherName: {
      type: String,
      default: "",
      trim: true,
    },

    fatherMobile: {
      type: String,
      default: "",
      trim: true,
    },

    familyDetails: {
      type: String,
      default: "",
      trim: true,
    },

    // =======================================================
    // OTHER PROFILE
    // =======================================================

    bio: {
      type: String,
      default: "",
      trim: true,
    },

    biodataUrl: {
      type: String,
      default: "",
      trim: true,
    },

    interests: {
      type: [String],
      default: [],
    },

    // =======================================================
    // PROFILE STATUS
    // =======================================================

    profileCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

/* =========================================================
   MODEL
========================================================= */

const User = mongoose.model("User", userSchema);

export default User;

export { DASHANAM_OPTIONS };
