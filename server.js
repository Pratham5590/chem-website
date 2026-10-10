
import express from "express";
import session from "express-session";
import "dotenv/config";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import {
  getResources,
  getVideos,
  addQuery,
  getQueries
} from "./database.js";

const app = express();
const PORT = process.env.PORT || 3000;

if (
  !process.env.SESSION_SECRET ||
  !process.env.ADMIN_USERNAME ||
  !process.env.ADMIN_PASSWORD
) {
  throw new Error(
    "Missing SESSION_SECRET, ADMIN_USERNAME, or ADMIN_PASSWORD in .env"
  );
}

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));

// Hash the configured admin password in memory.
const adminSalt = crypto.randomBytes(16);
const adminPasswordHash = crypto.scryptSync(
  process.env.ADMIN_PASSWORD,
  adminSalt,
  64
);

app.use(session({
  name: "chem_admin_session",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 1000 * 60 * 60 * 2
  }
}));

function requireAdmin(req, res, next) {
  if (req.session?.isAdmin) {
    return next();
  }

  if (req.path.startsWith("/api/")) {
    return res.status(401).json({
      success: false,
      message: "Please log in first."
    });
  }

  return res.redirect("/admin/login");
}

function sendPublicFile(res, filename) {
  res.sendFile(path.resolve("public", filename));
}

// Homepage
app.get("/", (req, res) => {
  sendPublicFile(res, "home.html");
});

// Admin login and dashboard
app.get("/admin", (req, res) => {
  res.redirect(req.session?.isAdmin
    ? "/admin/dashboard"
    : "/admin/login");
});

app.get("/admin/login", (req, res) => {
  if (req.session?.isAdmin) {
    return res.redirect("/admin/dashboard");
  }

  sendPublicFile(res, "admin/login.html");
});

app.get("/admin/dashboard", requireAdmin, (req, res) => {
  sendPublicFile(res, "admin/dashboard.html");
});

app.post("/api/admin/login", (req, res, next) => {
  const { username, password } = req.body ?? {};

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    username.length > 100 ||
    password.length > 200
  ) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid username and password."
    });
  }

  const submittedHash = crypto.scryptSync(
    password,
    adminSalt,
    64
  );

  const validUsername =
    username === process.env.ADMIN_USERNAME;

  const validPassword =
    crypto.timingSafeEqual(submittedHash, adminPasswordHash);

  if (!validUsername || !validPassword) {
    return res.status(401).json({
      success: false,
      message: "Incorrect username or password."
    });
  }

  // Regenerate the session after login to prevent session fixation.
  req.session.regenerate((error) => {
    if (error) return next(error);

    req.session.isAdmin = true;

    req.session.save((saveError) => {
      if (saveError) return next(saveError);

      res.json({
        success: true,
        redirect: "/admin/dashboard"
      });
    });
  });
});

app.post("/api/admin/logout", requireAdmin, (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);

    res.clearCookie("chem_admin_session", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    });

    res.json({ success: true });
  });
});

// Public website APIs
app.get("/getResources", async (req, res, next) => {
  try {
    res.json(await getResources());
  } catch (error) {
    next(error);
  }
});

app.get("/getVideos", async (req, res, next) => {
  try {
    res.json(await getVideos());
  } catch (error) {
    next(error);
  }
});

// Public contact form
app.post("/queries", async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body ?? {};

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof message !== "string" ||
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid name, email, and message."
      });
    }

    await addQuery(
      name.trim(),
      email.trim(),
      typeof subject === "string" ? subject.trim() : "",
      message.trim()
    );

    res.status(201).json({
      success: true,
      message: "Your enquiry has been submitted."
    });
  } catch (error) {
    next(error);
  }
});

// Private enquiries API
app.get("/api/admin/queries", requireAdmin, async (req, res, next) => {
  try {
    const queries = await getQueries();
    res.set("Cache-Control", "no-store");
    res.json(queries);
  } catch (error) {
    next(error);
  }
});

// Existing video files outside the public directory
app.get("/videos/TSO-6-FINAL.mp4", (req, res) => {
  res.sendFile(path.resolve("videos/TSO-6-FINAL.mp4"));
});

app.get(/^\/videos\/The%20Nun%20II%20\[Hindi\]-1080P\.mp4$/, (req, res) => {
  res.sendFile(path.resolve("videos/look up (1).mp4"));
});

app.get(/^\/videos\/Copy%20of%20TSO-3-FINAL\.mp4$/, (req, res) => {
  res.sendFile(path.resolve("videos/331030_medium.mp4"));
});

// Serve CSS, JavaScript, images, and public pages.
// The protected dashboard route above runs before static file serving.
app.use(express.static("public", {
  index: false
}));

app.use((req, res) => {
  res.status(404).sendFile(path.resolve("public/404.html"));
});

app.use((error, req, res, next) => {
  console.error(error);

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    success: false,
    message: "An unexpected server error occurred."
  });
});

app.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
});