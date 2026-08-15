import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    profilePhoto: String,
    fullName: { type: String, required: true, trim: true },
    gender: { type: String, enum: ["Male", "Female"], required: true },
    age: { type: Number, min: 18, required: true },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    education: String,
    occupation: String,
    city: String,
    height: String,
    religion: String,
    community: String,
    bio: String,
    familyDetails: String,
    biodataUrl: String,
    interests: [String]
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
