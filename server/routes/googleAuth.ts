import express from "express";
import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import { storage } from "../storage";
import { generateToken, createResponse } from "../middleware";
import type { User } from "@shared/schema";

const router = express.Router();

// ─── Passport Google Strategy ────────────────────────────────────────────────

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

// Determine the correct callback URL based on environment
const getCallbackUrl = () => {
  if (process.env.NODE_ENV === "production") {
    const backendUrl = process.env.BACKEND_URL || process.env.VITE_BACKEND_URL;
    return `${backendUrl}/api/auth/google/callback`;
  }
  return "http://localhost:5001/api/auth/google/callback";
};

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn(
    "⚠️  GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set. Google OAuth will be disabled."
  );
} else {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: getCallbackUrl(),
        scope: ["profile", "email"],
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done: (error: any, user?: User | false) => void
      ) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("No email returned from Google"), false);
          }

          // Check if user already exists
          let user = await storage.getUserByEmail(email);

          if (!user) {
            // Auto-create the user from Google profile
            const bcrypt = await import("bcryptjs");
            // Random password — user will never log in with it directly
            const randomPassword = await bcrypt.hash(
              Math.random().toString(36) + Date.now().toString(36),
              12
            );

            user = await storage.createUser({
              name:
                profile.displayName ||
                `${profile.name?.givenName ?? ""} ${profile.name?.familyName ?? ""}`.trim() ||
                email.split("@")[0],
              email,
              password: randomPassword,
              role: "user",
            });

            console.log(`[Google OAuth] Created new user: ${email} (ID: ${user.id})`);
          } else {
            console.log(`[Google OAuth] Existing user signed in: ${email} (ID: ${user.id})`);
          }

          return done(null, user);
        } catch (err) {
          console.error("[Google OAuth] Strategy error:", err);
          return done(err, false);
        }
      }
    )
  );

  // Minimal serialize / deserialize — we use JWT so we only need this for the
  // OAuth redirect flow, not persistent sessions.
  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || false);
    } catch (err) {
      done(err, false);
    }
  });
}

// ─── Routes ──────────────────────────────────────────────────────────────────

/**
 * GET /api/auth/google
 * Redirect to Google's OAuth consent page.
 */
router.get(
  "/google",
  (req, res, next) => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return res
        .status(503)
        .json(createResponse(false, null, "Google OAuth is not configured on this server."));
    }
    next();
  },
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

/**
 * GET /api/auth/google/callback
 * Google redirects here after user grants access.
 * Issues a JWT cookie and redirects the browser to the frontend.
 */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login?error=google_auth_failed",
  }),
  (req, res) => {
    try {
      const user = req.user as User;
      if (!user) {
        return res.redirect("/login?error=google_auth_failed");
      }

      const token = generateToken(user);

      const isProduction = process.env.NODE_ENV === "production";
      res.cookie("token", token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
        maxAge: 24 * 60 * 60 * 1000, // 24 h
        path: "/",
      });

      console.log(`[Google OAuth] Login successful for ${user.email}, redirecting to frontend`);

      // Redirect to frontend — the cookie is now set
      const frontendUrl =
        process.env.NODE_ENV === "production"
          ? process.env.FRONTEND_URL || ""
          : "http://localhost:5173";

      res.redirect(`${frontendUrl}/?oauth=success`);
    } catch (err) {
      console.error("[Google OAuth] Callback error:", err);
      res.redirect("/login?error=google_auth_failed");
    }
  }
);

export default router;
export { passport as configuredPassport };
