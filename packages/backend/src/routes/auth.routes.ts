import { Router } from "express";
import type { Request, Response, NextFunction, CookieOptions } from "express";
import { registerSchema, loginSchema } from "@taskflow/shared";
import { validate } from "../middleware/validate.js";
import * as authService from "../services/auth.service.js";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";

const router = Router();

// ── Cookie Options ─────────────────────────────────────

function getRefreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/v1/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
}

// ── Routes ─────────────────────────────────────────────

// POST /api/auth/register
router.post(
  "/register",
  validate(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await authService.register(req.body);
      res.status(201).json({ message: "Kayıt başarılı", user });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/auth/login
router.post(
  "/login",
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.login(req.body);

      res.cookie(
        "refreshToken",
        result.refreshToken,
        getRefreshCookieOptions(),
      );
      res.json({ accessToken: result.accessToken, user: result.user });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/auth/refresh
router.post(
  "/refresh",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) {
        throw ApiError.unauthorized("Refresh token bulunamadı");
      }

      const result = await authService.refresh(refreshToken);

      res.cookie(
        "refreshToken",
        result.refreshToken,
        getRefreshCookieOptions(),
      );
      res.json({ accessToken: result.accessToken, user: result.user });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/auth/logout
router.post(
  "/logout",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      res.clearCookie("refreshToken", getRefreshCookieOptions());
      res.json({ message: "Çıkış yapıldı" });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
