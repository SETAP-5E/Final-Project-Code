document.getElementById("registerForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const full_name = document.getElementById("full_name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const popup = document.getElementById("popup");
  const popupMessage = document.getElementById("popupMessage");

  try {
    const res = await fetch("http://localhost:5000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ full_name, email, password })
    });

    const data = await res.json();
    popupMessage.textContent = data.message || "Unexpected error";
    popup.classList.remove("hidden", "success", "error");
    popup.classList.add(res.ok ? "success" : "error");

    if (res.ok) this.reset();
  } catch (err) {
    console.error(err);
    popupMessage.textContent = "Network error. Please try again.";
    popup.classList.remove("hidden", "success", "error");
    popup.classList.add("error");
  }

  popup.classList.remove("hidden");
});

// ✅ Popup close button handler
document.getElementById("popupCloseBtn")?.addEventListener("click", () => {
  const popup = document.getElementById("popup");
  popup.classList.add("hidden");
  popup.classList.remove("success", "error");
});

// ================================
// Zoom Page & Fallback (Merged)
// ================================
window.addEventListener("DOMContentLoaded", () => {
  document.body.style.zoom = "140%";

  if (!("zoom" in document.body.style)) {
    document.body.style.transform = "scale(0.9)";
    document.body.style.transformOrigin = "top left";
    document.body.style.width = "111.11%";
  }
});
