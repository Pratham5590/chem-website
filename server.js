import http from 'http';
import { URL } from 'url';
import fs from 'fs';
import path from 'path';
import { getResources, getVideos, addQuery } from './database.js';

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost:3000");
  let file;
  if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/home.html")) {
    const home = fs.readFileSync("public/home.html", "utf8");
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(home);
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
  } else if (req.method === "GET" && url.pathname === "/resources.html") {
    file = fs.readFileSync("public/resources.html")
    res.writeHead(200, {
      "Content-Type" : "text/html"
    })
    res.end(file);
  } else if (req.method === "GET" && url.pathname === "/resources.js") {
    file = fs.readFileSync("public/resources.js")
    res.writeHead(200, {
      "Content-Type" : "text/javascript"
    })
    res.end(file);
  } else if (req.method === "GET" && url.pathname === "/getResources") {
    res.writeHead(200, {
      "Content-Type" : "application/json"
    })
    res.end(JSON.stringify(getResources()));
  } else if (req.method === "GET" && url.pathname === "/resources.css") {
    res.writeHead(200, {
      "Content-Type" : "text/css"
    })
    res.end(fs.readFileSync("public/resources.css"))
  } else if (req.method === "GET" && url.pathname === "/videos.html") {
    res.writeHead(200, {
      "Content-Type" : "text/html"
    })
    res.end(fs.readFileSync("public/videos.html"))
  } else if (req.method === "GET" && url.pathname === "/videos.css") {
    res.writeHead(200, {
      "Content-Type" : "text/css"
    })
    res.end(fs.readFileSync("public/videos.css"))
  } else if (req.method === "GET" && url.pathname === "/videos.js") {
    res.writeHead(200, {
      "Content-Type" : "text/javascript"
    })
    res.end(fs.readFileSync("public/videos.js"))
  } else if (req.method === "GET" && url.pathname === "/getVideos") {
    res.writeHead(200, {
      "Content-Type" : "application/json"
    })
    res.end(JSON.stringify(getVideos()));
  } else if (req.method === "GET" && url.pathname === "/videos/TSO-6-FINAL.mp4") {
    res.writeHead(200, {
      "Content-Type" : "video/mp4"
    })
    res.end(fs.readFileSync("videos/TSO-6-FINAL.mp4"))
  } else if (req.method === "GET" && url.pathname === "/videos/The%20Nun%20II%20[Hindi]-1080P.mp4") {
    res.writeHead(200, {
      "Content-Type" : "video/mp4"
    })
    res.end(fs.readFileSync("videos/look up (1).mp4"))
  } else if (req.method === "GET" && url.pathname === "/contact.html") {
    res.writeHead(200, { "Content-Type" : "text/html" })
    res.end(fs.readFileSync("public/contact.html"));
  }  else if (req.method === "GET" && url.pathname === "/contact.css") {
    res.writeHead(200, { "Content-Type" : "text/css" })
    res.end(fs.readFileSync("public/contact.css"));
  }  else if (req.method === "GET" && url.pathname === "/contact.js") {
    res.writeHead(200, { "Content-Type" : "text/javascript" })
    res.end(fs.readFileSync("public/contact.js"));
  } else if (req.method === "GET" && url.pathname === "/videos/Copy%20of%20TSO-3-FINAL.mp4") {
    res.writeHead(200, {
      "Content-Type" : "video/mp4"
    })
    res.end(fs.readFileSync("videos/331030_medium.mp4"))
  } else if (req.method === "POST" && url.pathname === "/queries") {
    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        const data = JSON.parse(body);

        const name = data.name;
        const email = data.email;
        const subject = data.subject;
        const message = data.message;

        if (!name || !email || !message) {
          res.writeHead(400, {
            "Content-Type": "application/json"
          });

          res.end(JSON.stringify({
            success: false,
            message: "Name, email, and message are required."
          }));

          return;
        }

        addQuery(name, email, subject, message);

        res.writeHead(201, {
          "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
          success: true,
          message: "Your enquiry has been submitted."
        }));

      } catch (error) {
        res.writeHead(400, {
          "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
          success: false,
          message: "Invalid request."
        }));
      }
    });
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
