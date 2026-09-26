const resourceList = document.querySelector("#resource-list");

async function loadResources() {
  let resources = await fetch("/getResources");
  let data = await resources.json();
  resourceList.innerHTML = ``;
  for  (let resource of data) {
    const article = document.createElement("article");
    article.classList.add("resource-item");
    const divOne = document.createElement("div");
    divOne.classList.add("resource-number")
    divOne.textContent = resource.id;
    article.append(divOne);
    const divTwo = document.createElement("div");
    divTwo.classList.add("resource-info");
    const resourceTitle = document.createElement("p");
    resourceTitle.setAttribute('class', 'resource-title');
    resourceTitle.textContent = resource.title;
    divTwo.append(resourceTitle);
    const resourceStudentClass = document.createElement("p");
    resourceStudentClass.setAttribute('class', 'resource-class');
    resourceStudentClass.textContent = `CLASS - ${resource.class}`;
    divTwo.append(resourceStudentClass);
    const resourceChapter = document.createElement("p");
    resourceChapter.setAttribute('class', 'resource-chapter');
    resourceChapter.textContent = resource.chapter;
    divTwo.append(resourceChapter)
    const resourceDesc = document.createElement("p");
    resourceDesc.setAttribute("class", "resource-description");
    resourceDesc.textContent = resource.description;
    divTwo.append(resourceDesc);
    article.append(divTwo);
    const divThree = document.createElement("div");
    divThree.setAttribute('class', 'resource-meta');
    const resourceType = document.createElement("span");
    resourceType.setAttribute("class", "resource-type");
    resourceType.textContent = resource.type;
    divThree.append(resourceType);
    const resourceDownload = document.createElement("a");
    resourceDownload.setAttribute("href", resource.file_path);
    resourceDownload.setAttribute("class", "resource-download");
    resourceDownload.textContent = "DOWNLOAD ↗"
    divThree.append(resourceDownload);
    article.append(divThree);
    resourceList.append(article);
  }
}
loadResources();