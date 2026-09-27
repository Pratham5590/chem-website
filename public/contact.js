const form = document.querySelector("#enquiry-form");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.querySelector("#name").value;
  const email = document.querySelector("#email-input").value;
  const subject = document.querySelector("#subject").value;
  const message = document.querySelector("#message").value;

  const response = await fetch("/queries", {
    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      name,
      email,
      subject,
      message
    })
  });

  const data = await response.json();

  if (data.success) {
    form.reset();

    const confirmation = document.createElement("p");

    confirmation.textContent = "Query submitted successfully!";

    confirmation.id = "confirmation-message";

    form.append(confirmation);

    setTimeout(() => {
      confirmation.remove();
    }, 5000);

  } else {
    const error = document.createElement("p");

    error.textContent = data.message;

    error.id = "error-message";

    form.append(error);

    setTimeout(() => {
      error.remove();
    }, 5000);
  }
});