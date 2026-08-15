import mongoose from "mongoose";

const interestSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

interestSchema.index({ from: 1, to: 1 }, { unique: true });

export default mongoose.model("Interest", interestSchema);
