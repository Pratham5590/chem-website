const resourceList = document.querySelector("#resource-list");
const filterForm = document.querySelector("#form");
const classFilter = document.querySelector("#class-filter");
const typeFilter = document.querySelector("#type-filter");

let resources = [];

function renderResources(items) {
  if (!resourceList) return;
  resourceList.replaceChildren();

  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No resources are available for this selection yet.";
    resourceList.append(empty);
    return;
  }

  for (const resource of items) {
    const article = document.createElement("article");
    article.className = "resource-item";

    const number = document.createElement("div");
    number.className = "resource-number";
    number.textContent = resource.id ?? "";
    article.append(number);

    const info = document.createElement("div");
    info.className = "resource-info";

    const title = document.createElement("p");
    title.className = "resource-title";
    title.textContent = resource.title || "Untitled resource";
    info.append(title);

    const studentClass = document.createElement("p");
    studentClass.className = "resource-class";
    studentClass.textContent = `CLASS - ${resource.class ?? ""}`;
    info.append(studentClass);

    const chapter = document.createElement("p");
    chapter.className = "resource-chapter";
    chapter.textContent = resource.chapter || "";
    info.append(chapter);

    const description = document.createElement("p");
    description.className = "resource-description";
    description.textContent = resource.description || "";
    info.append(description);

    article.append(info);

    const meta = document.createElement("div");
    meta.className = "resource-meta";

    const type = document.createElement("span");
    type.className = "resource-type";
    type.textContent = resource.type || "Resource";
    meta.append(type);

    if (resource.file_path) {
      const link = document.createElement("a");
      link.href = resource.file_path;
      link.className = "resource-download";
      link.textContent = "DOWNLOAD ↗";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      meta.append(link);
    }

    article.append(meta);
    resourceList.append(article);
  }
}

function applyFilters() {
  const selectedClass = String(classFilter?.value ?? "all");
  const selectedType = String(typeFilter?.value ?? "all");

  const filtered = resources.filter((resource) => {
    const classMatches = selectedClass === "all" || String(resource.class) === selectedClass;
    const typeMatches = selectedType === "all" || String(resource.type) === selectedType;
    return classMatches && typeMatches;
  });

  renderResources(filtered);
}

async function loadResources() {
  if (!resourceList) return;

  resourceList.textContent = "Loading resources…";
  try {
    const response = await fetch("/getResources", { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Request failed (${response.status}).`);

    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("The server returned an invalid resource list.");

    resources = data;
    applyFilters();
  } catch (error) {
    resourceList.textContent = error.message || "Unable to load resources. Please try again later.";
  }
}

filterForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  applyFilters();
});

loadResources();
