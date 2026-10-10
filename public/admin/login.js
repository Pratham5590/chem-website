const form = document.querySelector("#login-form");
const button = document.querySelector("#login-button");
const statusMessage = document.querySelector("#login-status");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  statusMessage.textContent = "";
  statusMessage.className = "status-message";
  button.disabled = true;
  button.textContent = "SIGNING IN…";

  try {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        username: form.elements.username.value,
        password: form.elements.password.value
      })
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      statusMessage.textContent = result.message || "Unable to sign in.";
      statusMessage.classList.add("error");
      return;
    }
    window.location.assign(result.redirect || "/admin/dashboard");
  } catch {
    statusMessage.textContent = "Unable to reach the server. Try again.";
    statusMessage.classList.add("error");
  } finally {
    button.disabled = false;
    button.innerHTML = 'SIGN IN <span aria-hidden="true">↗</span>';
  }
});
