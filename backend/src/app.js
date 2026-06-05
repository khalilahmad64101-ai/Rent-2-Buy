import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import os from "os";

import apiRouter from "./routes/api.js";

import {
  corsMiddleware,
  apiRateLimiter,
  mongoSanitizeMiddleware,
  xssProtectionMiddleware,
  expressHelmet,
  parameterPollutionProtection,
} from "./middleware/securityMiddleware.js";

import { csrfProtection } from "./middleware/csrfMiddleware.js";

export async function createApp() {
  const app = express();

  app.set("trust proxy", 1);

  app.use(expressHelmet);

  app.use(cookieParser());

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(parameterPollutionProtection);

  app.use(mongoSanitizeMiddleware);
  app.use(xssProtectionMiddleware);

  app.use(corsMiddleware);

  app.use("/uploads", express.static(path.join(os.tmpdir(), "uploads")));

  app.use((req, res, next) => {
    console.log(`[Request-Logger] ${req.method} ${req.url}`);
    next();
  });

  app.use("/api", apiRateLimiter);

  app.use(csrfProtection);

  app.use("/api", apiRouter);

  // Railway Health Check
  app.get("/", (req, res) => {
    res.status(200).json({
      success: true,
      message: "Rent2Buy Backend Running",
    });
  });

  // 404 Handler
  app.use("*", (req, res) => {
    res.status(404).json({
      success: false,
      message: "Route not found",
    });
  });

  return app;
}