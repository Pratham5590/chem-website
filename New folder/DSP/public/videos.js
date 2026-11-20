const filterForm = document.querySelector("#form");
const lectureList = document.querySelector("#video-list");
const classFilter = document.querySelector("#class-filter");

let videos = [];

function renderVideos(items) {
  if (!lectureList) return;
  lectureList.replaceChildren();

  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No videos are available for this selection yet.";
    lectureList.append(empty);
    return;
  }

  for (const video of items) {
    const article = document.createElement("article");
    article.className = "video-item";

    const playerWrap = document.createElement("div");
    playerWrap.className = "video-player";

    const player = document.createElement("video");
    player.className = "video-element";
    player.controls = true;
    player.preload = "metadata";

    const source = document.createElement("source");
    source.src = video.file_path || "";
    source.type = /\.webm(?:$|\?)/i.test(video.file_path || "") ? "video/webm" :
      /\.ogv(?:$|\?)/i.test(video.file_path || "") ? "video/ogg" : "video/mp4";
    player.append(source);
    playerWrap.append(player);
    article.append(playerWrap);

    const info = document.createElement("div");
    info.className = "video-info";

    const meta = document.createElement("div");
    meta.className = "video-meta";

    const studentClass = document.createElement("span");
    studentClass.className = "video-class";
    studentClass.textContent = `CLASS - ${video.class ?? ""}`;

    const duration = document.createElement("span");
    duration.className = "video-duration";
    duration.textContent = video.duration || "";

    meta.append(studentClass, duration);
    info.append(meta);

    const title = document.createElement("h3");
    title.className = "video-title";
    title.textContent = video.title || "Untitled lecture";

    const chapter = document.createElement("p");
    chapter.className = "video-chapter";
    chapter.textContent = video.chapter || "";

    const description = document.createElement("p");
    description.className = "video-description";
    description.textContent = video.description || "";

    info.append(title, chapter, description);
    article.append(info);

    const actions = document.createElement("div");
    actions.className = "video-actions";

    if (video.file_path) {
      const download = document.createElement("a");
      download.className = "video-download";
      download.textContent = "DOWNLOAD LECTURE ↗";
      download.href = video.file_path;
      download.download = "";
      actions.append(download);
    }

    article.append(actions);
    lectureList.append(article);
  }
}

function applyVideoFilter() {
  const selectedClass = String(classFilter?.value ?? "all");
  const filtered = videos.filter((video) =>
    selectedClass === "all" || String(video.class) === selectedClass
  );
  renderVideos(filtered);
}

async function loadVideos() {
  if (!lectureList) return;

  lectureList.textContent = "Loading videos…";
  try {
    const response = await fetch("/getVideos", { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Request failed (${response.status}).`);

    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("The server returned an invalid video list.");

    videos = data;
    const featured = document.querySelector("#featured-video");
    const featuredVideo = videos.find((video) => Number(video.id) === 1) || videos[0];

    if (featured && featuredVideo?.file_path) {
      featured.src = featuredVideo.file_path;
      featured.load();
    }

    applyVideoFilter();
  } catch (error) {
    lectureList.textContent = error.message || "Unable to load videos. Please try again later.";
  }
}

filterForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  applyVideoFilter();
});

loadVideos();
