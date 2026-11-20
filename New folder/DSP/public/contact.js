const form = document.querySelector("#enquiry-form");

if (form) {
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
      if (!field) return;
      field.classList.remove("field-error");
      field.removeAttribute("aria-invalid");
    });
  }

  function showStatus(message, type) {
    if (!status) return;
    status.textContent = message;
    status.className = type === "success" ? "status-success" : "status-error";
    status.hidden = false;
  }

  Object.values(fields).forEach((field) => {
    field?.addEventListener("input", () => {
      field.classList.remove("field-error");
      field.removeAttribute("aria-invalid");
      if (!Object.values(fields).some((item) => item?.classList.contains("field-error"))) {
        status.hidden = true;
        status.textContent = "";
        status.className = "";
      }
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFieldErrors();
    if (status) {
      status.hidden = true;
      status.textContent = "";
    }

    const payload = Object.fromEntries(
      Object.entries(fields).map(([key, field]) => [key, field?.value.trim() || ""])
    );

    const invalid = [];
    if (!payload.name) invalid.push(["name", "Please enter your name."]);
    if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      invalid.push(["email", "Please enter a valid email address."]);
    }
    if (!payload.subject) invalid.push(["subject", "Please enter a subject."]);
    if (!payload.message) invalid.push(["message", "Please enter your enquiry message."]);

    if (invalid.length) {
      invalid.forEach(([key]) => {
        fields[key]?.classList.add("field-error");
        fields[key]?.setAttribute("aria-invalid", "true");
      });
      showStatus(invalid.map(([, message]) => message).join(" "), "error");
      fields[invalid[0][0]]?.focus();
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
      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.success !== true) {
        throw new Error(result.message || "Your enquiry could not be submitted. Please try again.");
      }

      form.reset();
      clearFieldErrors();
      showStatus(result.message || "Your enquiry was submitted successfully.", "success");
    } catch (error) {
      showStatus(error.message || "Unable to connect to the server. Please try again.", "error");
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonText;
    }
  });
}
