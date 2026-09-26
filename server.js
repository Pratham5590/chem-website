import http from 'http';
import { URL } from 'url';
import fs from 'fs';
import path from 'path';

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost:3000");
  let file;
  if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/home.html")) {
    const home = fs.readFileSync("public/home.html", "utf8");
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(home);
  } else if (req.method === "GET" && url.pathname === "/home.js") {
    const script = fs.readFileSync("public/home.js", "utf8");
    res.writeHead(200, { "Content-Type": "text/javascript" });
    res.end(script);
  } else if (req.method === "GET" && url.pathname === "/styles.css") {
    const styles = fs.readFileSync("public/styles.css", "utf8");
    res.writeHead(200, { "Content-Type": "text/css" });
    res.end(styles);
  } else if (req.method === "GET" && url.pathname === "/images/hero.png") {
    file = fs.readFileSync("public/images/hero.png");
    res.writeHead(200, {
      "Content-Type" : "image/png"
    })
    res.end(file);
  } else if (req.method === "GET" && url.pathname === "/images/orgo%202.jpg") {
    file = fs.readFileSync("public/images/orgo 2.jpg")
    res.writeHead(200, {
      "Content-Type" : "image/jpeg"
    })
    res.end(file);
  } else if (req.method === "GET" && url.pathname === "/images/ChatGPT%20Image%20Sep%2025,%202026,%2009_07_06%20PM%20(1).png") {
    file = fs.readFileSync("public/images/ChatGPT Image Sep 25, 2026, 09_07_06 PM (1).png");
    res.writeHead(200, {
      "Content-Type" : "image/png"
    })
    res.end(file);
  } else if (req.method === "GET" && url.pathname === "/images/image%20(2).png") {
    file = fs.readFileSync("public/images/image (2).png");
    res.writeHead(200, {
      "Content-Type" : "image/png"
    })
    res.end(file);
  }
  else {
    // Fallback for 404 Not Found
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404 Not Found");
  }
});

server.listen(3000, () => {
  console.log("Server running at port 3000");
});
