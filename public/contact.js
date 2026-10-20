const form = document.querySelector("#enquiry-form");
const status = document.querySelector("#form-status");
const submitButton = form.querySelector('button[type="submit"]');
const fields = {
  name: document.querySelector("#name"),
  email: document.querySelector("#email-input"),
  subject: document.querySelector("#subject"),
  message: document.querySelector("#message")
};

function clearFieldErrors() {
  Object.values(fields).forEach((field) => {
    field.classList.remove("field-error");
    field.removeAttribute("aria-invalid");
  });
}

function showStatus(message, type) {
  status.textContent = message;
  status.className = type === "success" ? "status-success" : "status-error";
  status.hidden = false;
}

function markFieldsFromMessage(message) {
  const text = String(message || "").toLowerCase();
  const terms = {
    name: ["name"],
    email: ["email", "e-mail"],
    subject: ["subject"],
    message: ["message", "enquiry", "query"]
  };
  const matched = [];
  Object.entries(terms).forEach(([key, words]) => {
    if (words.some((word) => text.includes(word))) {
      fields[key].classList.add("field-error");
      fields[key].setAttribute("aria-invalid", "true");
      matched.push(fields[key]);
    }
  });
  if (matched.length) matched[0].focus();
}

Object.values(fields).forEach((field) => {
  field.addEventListener("input", () => {
    field.classList.remove("field-error");
    field.removeAttribute("aria-invalid");
    if (!Object.values(fields).some((item) => item.classList.contains("field-error"))) {
      status.hidden = true;
      status.textContent = "";
      status.className = "";
    }
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearFieldErrors();
  status.hidden = true;
  status.textContent = "";

  const payload = {
    name: fields.name.value.trim(),
    email: fields.email.value.trim(),
    subject: fields.subject.value.trim(),
    message: fields.message.value.trim()
  };

  const invalid = [];
  if (!payload.name) invalid.push(["name", "Please enter your name."]);
  if (!payload.email || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(payload.email)) {
    invalid.push(["email", "Please enter a valid email address."]);
  }
  if (!payload.message) invalid.push(["message", "Please enter your enquiry message."]);

  if (invalid.length) {
    invalid.forEach(([key]) => {
      fields[key].classList.add("field-error");
      fields[key].setAttribute("aria-invalid", "true");
    });
    showStatus(invalid.map(([, message]) => message).join(" "), "error");
    fields[invalid[0][0]].focus();
    return;
  }

  submitButton.disabled = true;
  const originalButtonText = submitButton.innerHTML;
  submitButton.textContent = "SENDING…";

  try {
    const response = await fetch("/queries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    let data = {};
    try { data = await response.json(); } catch { data = {}; }

    if (!response.ok || data.success !== true) {
      const message = data.message || "Your enquiry could not be submitted. Please check the highlighted fields and try again.";
      showStatus(message, "error");
      markFieldsFromMessage(message);
      return;
    }

    form.reset();
    clearFieldErrors();
    showStatus(data.message || "Your enquiry was submitted successfully.", "success");
  } catch {
    showStatus("Unable to connect to the server. Please check your connection and try again.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = originalButtonText;
  }
});
