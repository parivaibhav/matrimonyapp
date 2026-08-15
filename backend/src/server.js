  import "dotenv/config";
  import express from "express";
  import cors from "cors";
  import path from "path";
  import fs from "fs";
  import { fileURLToPath } from "url";
  import mongoose from "mongoose";

  import authRoutes from "./routes/auth.routes.js";
  import profileRoutes from "./routes/profile.routes.js";
  import interestRoutes from "./routes/interest.routes.js";

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const app = express();
  const PORT = process.env.PORT || 5000;

  const uploadsDir = path.join(__dirname, "../uploads");
  fs.mkdirSync(uploadsDir, { recursive: true });

  app.use(cors());
  app.use(express.json({ limit: "2mb" }));
  app.use("/uploads", express.static(uploadsDir));

  app.get("/api/health", (_, res) => {
    res.json({ ok: true, message: "Matrimony API is running" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/profiles", profileRoutes);
  app.use("/api/interests", interestRoutes);

  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("MongoDB connected");
      app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
    })
    .catch((error) => {
      console.error("MongoDB connection failed:", error.message);
      process.exit(1);
    });
