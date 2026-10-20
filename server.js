import express from "express";
import session from "express-session";
import dotenv from "dotenv";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";
import {
  getResources, getVideos, addQuery, getQueries,
  getAdminResources, createResource, updateResource, deleteResource,
  getAdminVideos, createVideo, updateVideo, deleteVideo,
  testDatabaseConnection
} from "./database.js";

dotenv.config();
const app = express();
const PORT = Number(process.env.PORT) || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicRoot = path.join(__dirname, "public");
const uploadRoot = path.join(__dirname, "uploads");
const isProduction = process.env.NODE_ENV === "production";
const sessionSecret = process.env.SESSION_SECRET;
const adminUsername = process.env.ADMIN_USERNAME;
const adminPassword = process.env.ADMIN_PASSWORD;

if (!sessionSecret || !adminUsername || !adminPassword) {
  console.warn("Warning: set SESSION_SECRET, ADMIN_USERNAME and ADMIN_PASSWORD in .env for admin login.");
}
app.disable("x-powered-by");
if (isProduction) app.set("trust proxy", 1);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(session({
  name: "chemistry_admin_session",
  secret: sessionSecret || crypto.randomBytes(32).toString("hex"),
  resave: false,
  saveUninitialized: false,
  proxy: isProduction,
  cookie: { httpOnly: true, sameSite: "lax", secure: isProduction, maxAge: 4 * 60 * 60 * 1000 }
}));

function sendPublicFile(res, filename) {
  const target = path.resolve(publicRoot, filename);
  if (!target.startsWith(publicRoot + path.sep)) return res.status(400).send("Invalid file path.");
  return res.sendFile(target, error => {
    if (error && !res.headersSent) res.status(error.statusCode || 404).send("Page not found.");
  });
}
function requireAdmin(req, res, next) {
  if (req.session?.isAdmin) return next();
  if (req.path.startsWith("/api/")) return res.status(401).json({ error: "Please sign in as an administrator." });
  return res.redirect("/admin/login");
}
function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}
function parseId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
function text(value) { return typeof value === "string" ? value.trim() : ""; }
function validClass(value) { return ["6", "7", "8", "9", "10", "11", "12"].includes(String(value)); }

// Upload folders and routes. Stored URLs are /uploads/<folder>/<filename>.
for (const folder of ["resources", "videos", "thumbnails"]) {
  fs.mkdirSync(path.join(uploadRoot, folder), { recursive: true });
}
const extensions = {
  resources: new Set([".pdf", ".doc", ".docx", ".ppt", ".pptx", ".jpg", ".jpeg", ".png"]),
  videos: new Set([".mp4", ".webm", ".ogv"]),
  thumbnails: new Set([".jpg", ".jpeg", ".png", ".webp"])
};
const storage = multer.diskStorage({
  destination(req, file, cb) {
    let folder;
    if (file.fieldname === "thumbnail") folder = "thumbnails";
    else if (req.originalUrl.includes("/api/admin/resources")) folder = "resources";
    else if (req.originalUrl.includes("/api/admin/videos")) folder = "videos";
    else return cb(new Error("Invalid upload destination."));
    cb(null, path.join(uploadRoot, folder));
  },
  filename(req, file, cb) {
    cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024, files: 2 },
  fileFilter(req, file, cb) {
    let category;
    if (file.fieldname === "thumbnail") category = "thumbnails";
    else if (req.originalUrl.includes("/api/admin/resources")) category = "resources";
    else if (req.originalUrl.includes("/api/admin/videos")) category = "videos";
    const ext = path.extname(file.originalname).toLowerCase();
    if (!category || !extensions[category].has(ext)) return cb(new Error("This file type is not allowed."));
    cb(null, true);
  }
});
app.use("/uploads", express.static(uploadRoot, { index: false, dotfiles: "deny" }));

// Public pages. All paths are resolved relative to this file, not the terminal's working directory.
app.get("/", (req, res) => sendPublicFile(res, "home.html"));
app.get("/home", (req, res) => res.redirect("/"));
app.get("/about", (req, res) => sendPublicFile(res, "about.html"));
app.get("/resources", (req, res) => sendPublicFile(res, "resources.html"));
app.get("/videos", (req, res) => sendPublicFile(res, "videos.html"));
app.get("/contact", (req, res) => sendPublicFile(res, "contact.html"));

// Public data APIs.
app.get("/getResources", asyncRoute(async (req, res) => res.json(await getResources())));
app.get("/getVideos", asyncRoute(async (req, res) => res.json(await getVideos())));
app.post("/queries", asyncRoute(async (req, res) => {
  const name = text(req.body.name), email = text(req.body.email);
  const subject = text(req.body.subject), message = text(req.body.message);
  if (!name || !email || !subject || !message) return res.status(400).json({ error: "Please complete all fields." });
  if (name.length > 120 || email.length > 254 || subject.length > 200 || message.length > 10000) {
    return res.status(400).json({ error: "One or more fields are too long." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Please enter a valid email address." });
  const id = await addQuery({ name, email, subject, message });
  res.status(201).json({ message: "Your message has been received.", id });
}));

// Admin pages. The management HTML files from the supplied UI ZIP are in public/ root.
app.get("/admin", (req, res) => res.redirect(req.session?.isAdmin ? "/admin/dashboard" : "/admin/login"));
app.get("/admin/login", (req, res) => req.session?.isAdmin ? res.redirect("/admin/dashboard") : sendPublicFile(res, "admin/login.html"));
app.get("/admin/dashboard", requireAdmin, (req, res) => sendPublicFile(res, "admin/dashboard.html"));
app.get("/admin/manage-resources", requireAdmin, (req, res) => sendPublicFile(res, "manage-resources.html"));
app.get("/admin/manage-videos", requireAdmin, (req, res) => sendPublicFile(res, "manage-videos.html"));

app.post("/api/admin/login", asyncRoute(async (req, res) => {
  const username = text(req.body.username);
  const password = typeof req.body.password === "string" ? req.body.password : "";
  if (!adminUsername || !adminPassword) return res.status(503).json({ error: "Admin login is not configured." });
  if (username !== adminUsername || password !== adminPassword) return res.status(401).json({ error: "Incorrect username or password." });
  req.session.regenerate(error => {
    if (error) return res.status(500).json({ error: "Could not start an admin session." });
    req.session.isAdmin = true;
    req.session.adminUsername = username;
    req.session.save(saveError => {
      if (saveError) return res.status(500).json({ error: "Could not save admin session." });
      res.json({ success: true, message: "Signed in successfully.", redirect: "/admin/dashboard" });
    });
  });
}));
app.post("/api/admin/logout", requireAdmin, (req, res, next) => {
  req.session.destroy(error => {
    if (error) return next(error);
    res.clearCookie("chemistry_admin_session", { httpOnly: true, sameSite: "lax", secure: isProduction });
    res.json({ message: "Signed out successfully.", redirect: "/admin/login" });
  });
});
app.get("/api/admin/queries", requireAdmin, asyncRoute(async (req, res) => res.json(await getQueries())));

// Resource CRUD API.
app.get("/api/admin/resources", requireAdmin, asyncRoute(async (req, res) => res.json(await getAdminResources())));
app.post("/api/admin/resources", requireAdmin, upload.single("file"), asyncRoute(async (req, res) => {
  const title = text(req.body.title), studentClass = text(req.body.class);
  const chapter = text(req.body.chapter), description = text(req.body.description), type = text(req.body.type);
  if (!title || !validClass(studentClass) || !chapter || !type) return res.status(400).json({ error: "Title, valid class, chapter and type are required." });
  if (!req.file) return res.status(400).json({ error: "Please upload a resource file." });
  const id = await createResource({ title, class: studentClass, chapter, description, type, file_path: `/uploads/resources/${req.file.filename}` });
  res.status(201).json({ message: "Resource created successfully.", id });
}));
app.put("/api/admin/resources/:id", requireAdmin, upload.single("file"), asyncRoute(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid resource ID." });
  const title = text(req.body.title), studentClass = text(req.body.class);
  const chapter = text(req.body.chapter), description = text(req.body.description), type = text(req.body.type);
  if (!title || !validClass(studentClass) || !chapter || !type) return res.status(400).json({ error: "Title, valid class, chapter and type are required." });
  const changed = await updateResource(id, { title, class: studentClass, chapter, description, type, file_path: req.file ? `/uploads/resources/${req.file.filename}` : null });
  const exists = (await getAdminResources()).some(row => Number(row.id) === id);
  if (!exists) return res.status(404).json({ error: "Resource not found." });
  res.json({ message: "Resource updated successfully.", changed: Boolean(changed) });
}));
app.delete("/api/admin/resources/:id", requireAdmin, asyncRoute(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid resource ID." });
  if (!(await deleteResource(id))) return res.status(404).json({ error: "Resource not found." });
  res.json({ message: "Resource deleted successfully." });
}));

// Video CRUD API.
app.get("/api/admin/videos", requireAdmin, asyncRoute(async (req, res) => res.json(await getAdminVideos())));
app.post("/api/admin/videos", requireAdmin, upload.fields([{ name: "file", maxCount: 1 }, { name: "thumbnail", maxCount: 1 }]), asyncRoute(async (req, res) => {
  const title = text(req.body.title), studentClass = text(req.body.class);
  const chapter = text(req.body.chapter), description = text(req.body.description), duration = text(req.body.duration);
  if (!title || !validClass(studentClass) || !chapter) return res.status(400).json({ error: "Title, valid class and chapter are required." });
  const video = req.files?.file?.[0], thumbnail = req.files?.thumbnail?.[0];
  if (!video) return res.status(400).json({ error: "Please upload a video file." });
  const id = await createVideo({ title, class: studentClass, chapter, description, duration, file_path: `/uploads/videos/${video.filename}`, thumbnail_path: thumbnail ? `/uploads/thumbnails/${thumbnail.filename}` : null });
  res.status(201).json({ message: "Video created successfully.", id });
}));
app.put("/api/admin/videos/:id", requireAdmin, upload.fields([{ name: "file", maxCount: 1 }, { name: "thumbnail", maxCount: 1 }]), asyncRoute(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid video ID." });
  const title = text(req.body.title), studentClass = text(req.body.class);
  const chapter = text(req.body.chapter), description = text(req.body.description), duration = text(req.body.duration);
  if (!title || !validClass(studentClass) || !chapter) return res.status(400).json({ error: "Title, valid class and chapter are required." });
  const video = req.files?.file?.[0], thumbnail = req.files?.thumbnail?.[0];
  const changed = await updateVideo(id, { title, class: studentClass, chapter, description, duration, file_path: video ? `/uploads/videos/${video.filename}` : null, thumbnail_path: thumbnail ? `/uploads/thumbnails/${thumbnail.filename}` : null });
  const exists = (await getAdminVideos()).some(row => Number(row.id) === id);
  if (!exists) return res.status(404).json({ error: "Video not found." });
  res.json({ message: "Video updated successfully.", changed: Boolean(changed) });
}));
app.delete("/api/admin/videos/:id", requireAdmin, asyncRoute(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid video ID." });
  if (!(await deleteVideo(id))) return res.status(404).json({ error: "Video not found." });
  res.json({ message: "Video deleted successfully." });
}));
app.get("/manage-content.css", (req, res) => {
  res.sendFile(path.join(publicRoot, "manage-content.css"));
});

// Serve CSS, JavaScript, images, favicon and other public assets before the 404 fallback.
app.use(express.static(publicRoot, { index: false, dotfiles: "deny" }));
app.use((req, res, next) => {
  const page = path.join(publicRoot, "404.html");
  if (fs.existsSync(page)) return res.status(404).sendFile(page, error => { if (error && !res.headersSent) next(error); });
  return res.status(404).send("404 - Page not found.");
});
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof multer.MulterError) {
    const message = error.code === "LIMIT_FILE_SIZE" ? "The uploaded file is too large." : "The upload could not be processed.";
    return res.status(400).json({ error: message });
  }
  if (["This file type is not allowed.", "Invalid upload destination."].includes(error?.message)) {
    return res.status(400).json({ error: error.message });
  }
  console.error("Server error:", error);
  res.status(500).json({ error: isProduction ? "An internal server error occurred." : error.message });
});

try {
  await testDatabaseConnection();
  console.log("MySQL connection successful.");
} catch (error) {
  console.error("Could not connect to MySQL:", error.message);
}

app.listen(PORT, () => console.log(`Chemistry website running at ${PORT}`));
