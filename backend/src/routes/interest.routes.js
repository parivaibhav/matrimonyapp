import { Router } from "express";
import Interest from "../models/Interest.js";
import User from "../models/User.js";
import { auth } from "../middleware/auth.js";

const router = Router();

router.post("/:profileId", auth, async (req, res) => {
  try {
    if (String(req.userId) === String(req.params.profileId)) {
      return res.status(400).json({ message: "You cannot send interest to yourself" });
    }

    const target = await User.findById(req.params.profileId);
    if (!target) return res.status(404).json({ message: "Profile not found" });

    const existing = await Interest.findOne({
      from: req.userId,
      to: req.params.profileId
    });

    if (existing) {
      return res.status(409).json({ message: "Interest already sent" });
    }

    const interest = await Interest.create({
      from: req.userId,
      to: req.params.profileId
    });

    res.status(201).json({
      message: "Interest sent successfully",
      interest
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Interest already sent" });
    }
    res.status(500).json({ message: "Could not send interest" });
  }
});

router.get("/sent/list", auth, async (req, res) => {
  const interests = await Interest.find({ from: req.userId })
    .populate("to", "-passwordHash")
    .sort({ createdAt: -1 });

  res.json(interests);
});

export default router;
