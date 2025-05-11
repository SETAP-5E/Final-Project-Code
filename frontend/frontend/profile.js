// ✅ UPDATED profile.js with Country Code Dropdown + Corrected Stats Fetch
(function profileModule() {
  if (!window.location.href.includes("Profile.html")) return;

  const modal = document.getElementById("customModal");
  const modalMsg = document.getElementById("modalMessage");
  const modalActions = document.getElementById("modalActions");
  const closeModalBtn = document.getElementById("closeModalBtn");

  function showModal(message, onConfirm = null) {
    if (!modal || !modalMsg || !modalActions || !closeModalBtn) return;
    modalMsg.textContent = message;
    modal.style.display = "flex";
    modalActions.innerHTML = "";

    if (onConfirm) {
      const yesBtn = document.createElement("button");
      yesBtn.textContent = "✅ Yes";
      yesBtn.className = "modal-confirm";
      yesBtn.onclick = () => {
        modal.style.display = "none";
        onConfirm();
      };

      const cancelBtn = document.createElement("button");
      cancelBtn.textContent = "❌ Cancel";
      cancelBtn.className = "modal-cancel";
      cancelBtn.onclick = () => {
        modal.style.display = "none";
      };

      modalActions.appendChild(yesBtn);
      modalActions.appendChild(cancelBtn);
      closeModalBtn.style.display = "none";
    } else {
      closeModalBtn.style.display = "inline-block";
    }
  }

  closeModalBtn?.addEventListener("click", () => {
    modal.style.display = "none";
  });

  fetch("http://localhost:5000/api/profile", {
    credentials: "include",
  })
    .then(res => res.json())
    .then(user => {
      if (!user || !user.id) return;
      document.getElementById("userIdStat").innerText = user.id;
      document.getElementById("userName").value = user.full_name || "";
      document.getElementById("userEmail").value = user.email || "";
      document.getElementById("userLocation").value = user.location || "";
      document.getElementById("userBirthday").value = user.birthdate?.split("T")[0] || "";
      document.getElementById("userGender").value = user.gender || "";
      document.getElementById("phone_number").value = user.phone_number || "";

      const countryCode = user.country_code || "+1";
      document.getElementById("country_code").value = countryCode;

      // ✅ Fix: also update visible dropdown
      const dropdownButton = document.getElementById("selected-country");
      const matchingItem = document.querySelector(`.dropdown-item[data-code="${countryCode}"]`);
      if (matchingItem && dropdownButton) {
        const selectedFlag = matchingItem.getAttribute("data-flag");
        dropdownButton.innerHTML = `
          <img src="assets/flags/${selectedFlag}.png" class="flag-icon" alt="Flag"> ${countryCode}
        `;
      }

      document.getElementById("profilePreview").src = user.profile_picture
        ? `http://localhost:5000/uploads/${user.profile_picture}`
        : "default.png";

      const s = parseInt(user.strength) || 0;
      const stars = "★".repeat(s) + "☆".repeat(10 - s);
      document.getElementById("strengthStars").innerHTML = `${stars} <span class='strength-label'>(${s} / 10)</span>`;
    })
    .catch(err => {
      console.error("❌ Failed to load profile:", err);
      showModal("❌ Failed to load profile info.");
    });

  fetch("http://localhost:5000/api/profile/stats/update", {
    credentials: "include"
  })
  .then(res => res.json())
  .then(data => {
    document.getElementById("wins").innerText = typeof data.wins === 'number' ? data.wins : 0;
    document.getElementById("losses").innerText = typeof data.losses === 'number' ? data.losses : 0;
    document.getElementById("totalMatches").innerText = (data.wins || 0) + (data.losses || 0);

    const strength = typeof data.strength === 'number' ? data.strength : 0;
    const stars = "★".repeat(strength) + "☆".repeat(10 - strength);
    document.getElementById("strengthStars").innerHTML =
      `${stars} <span class='strength-label' id="strengthLabel">(${strength} / 10)</span>`;
  })
  .catch(err => {
    console.error("❌ Failed to load/update match stats:", err);
  });

  document.getElementById("profilePhoto")?.addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById("profilePreview").src = e.target.result;
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append("profile_picture", file);

    fetch("http://localhost:5000/api/profile/upload", {
      method: "POST",
      credentials: "include",
      body: formData,
    })
      .then(res => res.json())
      .then(data => {
        if (data.filename) {
          showModal("✅ Profile picture updated!");
        } else {
          showModal("❌ Failed to upload picture.");
        }
      })
      .catch(err => {
        console.error("❌ Upload failed:", err);
        showModal("❌ Upload failed.");
      });
  });

  document.getElementById("profileForm")?.addEventListener("submit", function (e) {
    e.preventDefault();
    const updatedData = {
      full_name: document.getElementById("userName").value.trim(),
      email: document.getElementById("userEmail").value.trim(),
      location: document.getElementById("userLocation").value.trim(),
      birthdate: document.getElementById("userBirthday").value,
      gender: document.getElementById("userGender").value,
      phone_number: document.getElementById("phone_number").value,
      country_code: document.getElementById("country_code").value
    };

    const newPassword = document.getElementById("newPassword")?.value.trim();
    const confirmPassword = document.getElementById("confirmPassword")?.value.trim();
    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        showModal("❗ Passwords do not match!");
        return;
      }
      updatedData.password = newPassword;
    }

    fetch("http://localhost:5000/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(updatedData)
    })
      .then(res => res.json())
      .then(data => {
        showModal(data.message ? `✅ ${data.message}` : "❌ Update failed.");
      })
      .catch(err => {
        console.error("❌ Update failed:", err);
        showModal("❌ Failed to update profile.");
      });
  });

  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    showModal("Are you sure you want to logout?", () => {
      fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
        .then(() => {
          window.location.href = "index.html";
        })
        .catch(() => {
          window.location.href = "index.html";
        });
    });
  });

  // ✅ Country Code Dropdown Logic (Match Book a Court)
  const dropdownButton = document.getElementById("selected-country");
  const countryCodeInput = document.getElementById("country_code");
  const searchInput = document.getElementById("search-country");
  const dropdownContent = document.querySelector(".dropdown-content");
  const countryItems = document.querySelectorAll(".dropdown-item");

  if (dropdownButton && dropdownContent && countryItems.length > 0) {
    dropdownButton.addEventListener("click", (event) => {
      event.stopPropagation();
      const isVisible = dropdownContent.style.display === "block";
      document.querySelectorAll(".dropdown-content").forEach(d => d.style.display = "none");
      dropdownContent.style.display = isVisible ? "none" : "block";
    });

    countryItems.forEach(item => {
      item.addEventListener("click", function () {
        const selectedCode = this.getAttribute("data-code");
        const selectedFlag = this.getAttribute("data-flag");

        dropdownButton.innerHTML = `
          <img src="assets/flags/${selectedFlag}.png" class="flag-icon" alt="Flag"> ${selectedCode}
        `;
        countryCodeInput.value = selectedCode;
        dropdownContent.style.display = "none";
      });
    });

    searchInput?.addEventListener("input", function () {
      const searchValue = searchInput.value.toLowerCase();
      countryItems.forEach(item => {
        const countryText = item.textContent.toLowerCase();
        item.style.display = countryText.includes(searchValue) ? "block" : "none";
      });

      if (searchValue === "") {
        countryItems.forEach(item => item.style.display = "block");
      }
    });

    searchInput?.addEventListener("focus", function () {
      dropdownContent.style.display = "block";
    });

    document.addEventListener("click", function (event) {
      if (!event.target.closest(".custom-dropdown")) {
        dropdownContent.style.display = "none";
      }
    });
  }
})();

const profilePhotoInput = document.getElementById('profilePhoto');
const fileNameDisplay = document.getElementById('fileNameDisplay');

profilePhotoInput?.addEventListener('change', function () {
  const fileName = this.files[0] ? this.files[0].name : 'No file chosen';
  fileNameDisplay.textContent = fileName;
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
