import mongoose from "mongoose";

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

const userSchema = new mongoose.Schema(
  {
    // =========================
    // ACCOUNT DETAILS
    // =========================

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    // =========================
    // PROFILE DETAILS
    // =========================

    profilePhoto: {
      type: String,
      default: "",
    },

    fullName: {
      type: String,
      default: "",
      trim: true,
    },

    gender: {
      type: String,
      enum: ["Male", "Female"],
      default: "Male",
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

    religion: {
      type: String,
      default: "",
      trim: true,
    },

    // Dasha Nam / Dashanami
    dashaNam: {
      type: String,
      enum: DASHANAM_OPTIONS,
      default: "",
    },

    community: {
      type: String,
      default: "",
      trim: true,
    },

    // =========================
    // FAMILY DETAILS
    // =========================

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

    // =========================
    // OTHER PROFILE DETAILS
    // =========================

    bio: {
      type: String,
      default: "",
      trim: true,
    },

    biodataUrl: {
      type: String,
      default: "",
    },

    interests: {
      type: [String],
      default: [],
    },

    // =========================
    // PROFILE STATUS
    // =========================

    profileCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("User", userSchema);

export { DASHANAM_OPTIONS };
