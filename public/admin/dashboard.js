const queryList = document.querySelector("#query-list");
const searchInput = document.querySelector("#query-search");
const refreshButton = document.querySelector("#refresh-button");
const logoutButton = document.querySelector("#logout-button");
const totalCount = document.querySelector("#total-count");
const latestDate = document.querySelector("#latest-date");
const visibleCount = document.querySelector("#visible-count");

let queries = [];

function formatDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function addTextElement(parent, tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text || "";
  parent.append(element);
  return element;
}

function renderQueries() {
  const term = searchInput.value.trim().toLowerCase();
  const filtered = queries.filter((query) => {
    const haystack = [query.name, query.email, query.subject, query.message]
      .join(" ").toLowerCase();
    return haystack.includes(term);
  });

  totalCount.textContent = String(queries.length);
  visibleCount.textContent = String(filtered.length);
  latestDate.textContent = queries.length ? formatDate(queries[0].created_at) : "None yet";
  queryList.replaceChildren();

  if (filtered.length === 0) {
    addTextElement(queryList, "p", "empty-state", queries.length
      ? "No enquiries match your search."
      : "No enquiries have been submitted yet.");
    return;
  }

  for (const query of filtered) {
    const article = document.createElement("article");
    article.className = "query-item";
    const top = document.createElement("div");
    top.className = "query-item-top";

    const senderBlock = document.createElement("div");
    addTextElement(senderBlock, "div", "query-sender", query.name || "Unknown sender");

    const email = document.createElement("a");
    email.className = "query-email";
    email.textContent = query.email || "No email provided";
    if (query.email) email.href = `mailto:${query.email}`;
    senderBlock.append(email);

    addTextElement(top, "time", "query-date", formatDate(query.created_at));
    top.prepend(senderBlock);
    article.append(top);

    if (query.subject) addTextElement(article, "h3", "query-subject", query.subject);
    addTextElement(article, "p", "query-message", query.message || "(No message)");
    queryList.append(article);
  }
}

async function loadQueries() {
  refreshButton.disabled = true;
  refreshButton.textContent = "Loading…";

  try {
    const response = await fetch("/api/admin/queries", {
      credentials: "same-origin",
      cache: "no-store"
    });
    if (response.status === 401) {
      window.location.replace("/admin/login");
      return;
    }
    if (!response.ok) throw new Error("Could not load enquiries.");
    queries = await response.json();
    renderQueries();
  } catch {
    queryList.replaceChildren();
    addTextElement(queryList, "p", "empty-state",
      "Unable to load enquiries. Check your connection and try again.");
  } finally {
    refreshButton.disabled = false;
    refreshButton.textContent = "Refresh ↻";
  }
}

searchInput.addEventListener("input", renderQueries);
refreshButton.addEventListener("click", loadQueries);

logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;
  try {
    await fetch("/api/admin/logout", {
      method: "POST",
      credentials: "same-origin"
    });
  } finally {
    window.location.replace("/admin/login");
  }
});

loadQueries();
