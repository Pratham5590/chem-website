import express from "express";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getResources, getVideos, addQuery } from "./database.js";

dotenv.config();

const app = express();
const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const publicRoot = path.join(dirname, "public");
const isProduction = process.env.NODE_ENV === "production";

app.disable("x-powered-by");
app.set("trust proxy", isProduction ? 1 : false);

app.use(express.json({ limit: "32kb" }));
app.use(express.urlencoded({ extended: false, limit: "32kb" }));

function sendPage(res, filename) {
  const target = path.join(publicRoot, filename);
  if (!target.startsWith(publicRoot + path.sep)) {
    return res.status(400).send("Invalid page path.");
  }
  return res.sendFile(target, (error) => {
    if (error && !res.headersSent) {
      res.status(error.statusCode || 404).send("Page not found.");
    }
  });
}

function asyncRoute(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function databaseError(res, error, operation) {
  console.error(`[${operation}]`, error);
  if (error?.code === "DB_CONFIG_MISSING") {
    return res.status(503).json({
      success: false,
      message: "The website database has not been configured yet."
    });
  }
  return res.status(503).json({
    success: false,
    message: "The service is temporarily unavailable. Please try again later."
  });
}

// The admin/content-management interface has deliberately been retired.
// Block its pages and scripts before static-file handling.
app.use((req, res, next) => {
  const pathname = req.path.toLowerCase();
  const retiredAdminPath =
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/api/admin") ||
    pathname === "/manage-resources" ||
    pathname === "/manage-resources.html" ||
    pathname === "/manage-resources.js" ||
    pathname === "/manage-videos" ||
    pathname === "/manage-videos.html" ||
    pathname === "/manage-videos.js" ||
    pathname === "/manage-content.css";

  if (retiredAdminPath) {
    return res.status(404).send("Page not found.");
  }
  next();
});

// Public pages.
app.get("/", (req, res) => sendPage(res, "home.html"));
app.get("/home", (req, res) => res.redirect(301, "/"));
app.get("/about", (req, res) => sendPage(res, "about.html"));
app.get("/resources", (req, res) => sendPage(res, "resources.html"));
app.get("/videos", (req, res) => sendPage(res, "videos.html"));
app.get("/contact", (req, res) => sendPage(res, "contact.html"));

// Public read-only content APIs.
app.get("/getResources", asyncRoute(async (req, res) => {
  try {
    const resources = await getResources();
    res.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    res.json(resources);
  } catch (error) {
    databaseError(res, error, "getResources");
  }
}));

app.get("/getVideos", asyncRoute(async (req, res) => {
  try {
    const videos = await getVideos();
    res.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    res.json(videos);
  } catch (error) {
    databaseError(res, error, "getVideos");
  }
}));

// Public contact form.
app.post("/queries", asyncRoute(async (req, res) => {
  const name = cleanText(req.body?.name);
  const email = cleanText(req.body?.email);
  const subject = cleanText(req.body?.subject);
  const message = cleanText(req.body?.message);

  if (!name || !email || !subject || !message) {
    return res.status(400).json({
      success: false,
      message: "Please complete all fields."
    });
  }

  if (name.length > 120 || email.length > 254 || subject.length > 200 || message.length > 10000) {
    return res.status(400).json({
      success: false,
      message: "One or more fields are too long."
    });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid email address."
    });
  }

  try {
    await addQuery({ name, email, subject, message });
    return res.status(201).json({
      success: true,
      message: "Your message has been received."
    });
  } catch (error) {
    return databaseError(res, error, "saveContactEnquiry");
  }
}));

// Static frontend assets. HTML pages are served explicitly above.
app.use(express.static(publicRoot, {
  index: false,
  dotfiles: "deny",
  fallthrough: true,
  maxAge: isProduction ? "1h" : 0
}));

app.get("/healthz", (req, res) => {
  res.status(200).json({ success: true, service: "chemistry-website" });
});

// Branded 404 page when present.
app.use((req, res) => {
  const notFoundPage = path.join(publicRoot, "404.html");
  if (fs.existsSync(notFoundPage)) {
    return res.status(404).sendFile(notFoundPage);
  }
  return res.status(404).send("404 - Page not found.");
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  console.error("Unhandled request error:", error);
  return res.status(500).json({
    success: false,
    message: isProduction
      ? "An internal server error occurred."
      : error.message
  });
});

// Vercel imports the Express app as a serverless function.
// Local development starts a normal HTTP listener.
if (!process.env.VERCEL) {
  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => {
    console.log(`Chemistry website running at http://localhost:${port}`);
  });
}

export default app;
