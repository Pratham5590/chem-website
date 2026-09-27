const resourceList = document.querySelector("#resource-list");
const form = document.querySelector("#form");
const classFilter = document.querySelector("#class-filter");
const typeFilter = document.querySelector("#type-filter");

let resources = [];

async function getData() {
  const response = await fetch("/getResources");
  resources = await response.json();

  loadResources(resources);
}

function filterResources(classValue, typeValue) {
  const filteredResources = [];

  for (let i = 0; i < resources.length; i++) {
    const resource = resources[i];

    const classMatches =
      classValue === "all" || resource.class === classValue;

    const typeMatches =
      typeValue === "all" || resource.type === typeValue;

    if (classMatches && typeMatches) {
      filteredResources.push(resource);
    }
  }

  return filteredResources;
}

function loadResources(data) {
  resourceList.innerHTML = "";

  for (let resource of data) {
    const article = document.createElement("article");
    article.classList.add("resource-item");

    const divOne = document.createElement("div");
    divOne.classList.add("resource-number");
    divOne.textContent = resource.id;

    article.append(divOne);

    const divTwo = document.createElement("div");
    divTwo.classList.add("resource-info");

    const resourceTitle = document.createElement("p");
    resourceTitle.classList.add("resource-title");
    resourceTitle.textContent = resource.title;

    divTwo.append(resourceTitle);

    const resourceStudentClass = document.createElement("p");
    resourceStudentClass.classList.add("resource-class");
    resourceStudentClass.textContent = `CLASS - ${resource.class}`;

    divTwo.append(resourceStudentClass);

    const resourceChapter = document.createElement("p");
    resourceChapter.classList.add("resource-chapter");
    resourceChapter.textContent = resource.chapter;

    divTwo.append(resourceChapter);

    const resourceDesc = document.createElement("p");
    resourceDesc.classList.add("resource-description");
    resourceDesc.textContent = resource.description;

    divTwo.append(resourceDesc);

    article.append(divTwo);

    const divThree = document.createElement("div");
    divThree.classList.add("resource-meta");

    const resourceType = document.createElement("span");
    resourceType.classList.add("resource-type");
    resourceType.textContent = resource.type;

    divThree.append(resourceType);

    const resourceDownload = document.createElement("a");
    resourceDownload.href = resource.file_path;
    resourceDownload.classList.add("resource-download");
    resourceDownload.textContent = "DOWNLOAD ↗";

    divThree.append(resourceDownload);

    article.append(divThree);

    resourceList.append(article);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const selectedClass =
    classFilter.value === "all"
      ? "all"
      : Number(classFilter.value);
  const selectedType = typeFilter.value;

  const filteredResources =
    filterResources(selectedClass, selectedType);

  loadResources(filteredResources);
});

getData();