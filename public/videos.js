const form = document.querySelector("#form");
const lectureList = document.querySelector("#video-list");
const filter = document.querySelector("#class-filter");

async function loadVideos(data) {
  for (let video of data) {
    const article = document.createElement("article")
    article.setAttribute("class", "video-item")
    const divOne = document.createElement("div");
    divOne.classList.add("video-player");
    const videoElement = document.createElement("video");
    videoElement.setAttribute("class", "video-element");
    videoElement.setAttribute("controls", "");
    const source = document.createElement("source");
    source.setAttribute("class", "video-source");
    source.setAttribute("src", video.file_path);
    source.setAttribute("type", "video/mp4");
    videoElement.append(source);
    divOne.append(videoElement);
    article.append(divOne)
    const divTwo = document.createElement("div");
    divTwo.classList.add("video-info");
    const videoMeta = document.createElement("div");
    videoMeta.classList.add("video-meta");
    const spanOne = document.createElement("span")
    spanOne.classList.add("video-class");
    spanOne.textContent = `CLASS - ${video.class}`
    const spanTwo = document.createElement("span");
    spanTwo.classList.add("video-duration");
    spanTwo.textContent = video.duration
    videoMeta.append(spanOne)
    videoMeta.append(spanTwo)
    divTwo.append(videoMeta)
    const h = document.createElement("h3")
    h.classList.add("video-title")
    h.textContent = video.title;
    const pOne = document.createElement("p")
    pOne.classList.add("video-chapter");
    pOne.textContent = video.chapter;
    const pTwo = document.createElement("p")
    pTwo.classList.add("video-description")
    pTwo.textContent = video.description;
    divTwo.append(h)
    divTwo.append(pOne)
    divTwo.append(pTwo)
    article.append(divTwo)
    const divThree = document.createElement("div")
    divThree.classList.add("video-actions")
    const a = document.createElement("a")
    a.classList.add("video-download")
    a.textContent = "DOWNLOAD LECTURE ↗"
    a.setAttribute("href", video.file_path)
    a.setAttribute("download", "");
    divThree.append(a)
    article.append(divThree)
    lectureList.append(article);
  }
}

async function getData() {
  const response = await fetch("/getVideos");
  const data = await response.json();
  loadVideos(data);
}
getData();