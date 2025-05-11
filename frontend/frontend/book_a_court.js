/* Book a Court Logic */
(function bookCourtModule() {
  document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("form");
    const modal = document.getElementById("customModal");
    const modalMsg = document.getElementById("modalMessage");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const matchDateInput = document.getElementById("match_date");
    const matchTimeInput = document.getElementById("match_time");
    const courtSelect = document.getElementById("location");

    const showModal = (message) => {
      if (modal && modalMsg) {
        modalMsg.textContent = message;
        modal.style.display = "flex";
      }
    };

    closeModalBtn?.addEventListener("click", () => {
      modal.style.display = "none";
    });

    fetch("http://localhost:5000/api/profile", {
      credentials: "include"
    })
      .then(res => res.json())
      .then(user => {
        if (!user || !user.id) return;
        document.getElementById("name").value = user.full_name || "";
        document.getElementById("email").value = user.email || "";
        document.getElementById("phone_number").value = user.phone_number || "";
        document.getElementById("country_code").value = user.country_code || "+1";

        const dropdownButton = document.getElementById("selected-country");
        if (user.country_code && dropdownButton) {
          const matchingItem = document.querySelector(`.dropdown-item[data-code='${user.country_code}']`);
          if (matchingItem) {
            const selectedFlag = matchingItem.getAttribute("data-flag");
            dropdownButton.innerHTML = `
              <img src="assets/flags/${selectedFlag}.png" class="flag-icon" alt="Flag"> ${user.country_code}
            `;
          }
        }
      })
      .catch(err => console.error("❌ Failed to fetch profile for autofill:", err));

    if (form) {
      form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = document.getElementById("name")?.value.trim();
        const email = document.getElementById("email")?.value.trim();
        const phone = document.getElementById("phone_number")?.value.trim();
        const countryCode = document.getElementById("country_code")?.value.trim();
        const matchDate = matchDateInput?.value;
        const matchTime = matchTimeInput?.value;
        const courtId = courtSelect?.value;
        const courtNameText = courtSelect?.options[courtSelect.selectedIndex]?.text || "";

        if (!name || !email || !phone || !countryCode || !matchDate || !matchTime || !courtId) {
          showModal("⚠️ Please fill out all fields before submitting.");
          return;
        }

        if (!validateEmail(email)) {
          showModal("⚠️ Invalid email format. Please enter a valid email.");
          return;
        }

        if (!validatePhone(phone)) {
          showModal("⚠️ Invalid phone number. Please enter only numbers.");
          return;
        }

        if (!Array.from(matchTimeInput.options).some(opt => opt.value === matchTime)) {
          showModal("⚠️ This time is no longer available. Please select another time.");
          return;
        }

        try {
          const response = await fetch('http://localhost:5000/api/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              court_id: courtId,
              court_name: courtNameText.split("(")[0].trim(),
              location: courtNameText.match(/\((.*?)\)/)?.[1] || "Unknown",
              booking_date: matchDate,
              booking_time: matchTime
            })
          });

          const result = await response.json();
          if (response.ok) {
            showModal("✅ Court booked successfully!");
            form.reset();
            matchTimeInput.disabled = true;
            matchTimeInput.innerHTML = '<option value="">Select Time</option>';
          } else {
            showModal(`❌ ${result.message || 'Booking failed!'}`);
          }
        } catch (error) {
          console.error('Booking error:', error);
          showModal("❌ Booking failed due to network error.");
        }
      });
    }

    function validateEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function validatePhone(phone) {
      return /^[0-9]{8,15}$/.test(phone);
    }

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

    function loadCourts() {
      fetch('http://localhost:5000/api/courts', { credentials: 'include' })
        .then(response => response.json())
        .then(data => {
          const locationSelect = document.getElementById('location');
          locationSelect.innerHTML = '<option value="">Select Location</option>';
          const courts = Array.isArray(data) ? data : data.courts;

          if (Array.isArray(courts)) {
            courts.forEach(court => {
              const option = document.createElement('option');
              option.value = court.id;
              option.textContent = `${court.name} (${court.location})`;
              locationSelect.appendChild(option);
            });
          }
        })
        .catch(error => {
          console.error('❌ Error loading courts:', error);
        });
    }

    loadCourts();

    function updateAvailableTimes() {
      const courtId = courtSelect.value;
      const selectedDate = matchDateInput.value;

      if (!courtId || !selectedDate) {
        matchTimeInput.innerHTML = '<option value="">Select Time</option>';
        matchTimeInput.disabled = true;
        return;
      }

      matchTimeInput.disabled = true;
      matchTimeInput.innerHTML = '<option value="">Loading...</option>';

      fetch(`http://localhost:5000/api/book/blocked?court_id=${courtId}&booking_date=${selectedDate}`, {
        credentials: 'include'
      })
        .then(res => res.json())
        .then(data => {
          const blocked = new Set(data.blocked || []);
          const allowedTimes = [];

          for (let h = 6; h <= 21; h++) {
            const time = `${String(h).padStart(2, '0')}:00`;
            if (!blocked.has(time)) {
              allowedTimes.push(time);
            }
          }

          matchTimeInput.innerHTML = '';

          if (allowedTimes.length === 0) {
            matchTimeInput.innerHTML = '<option value="">No available times</option>';
            matchTimeInput.disabled = true;
          } else {
            matchTimeInput.innerHTML = '<option value="">Select Time</option>';
            allowedTimes.forEach(time => {
              const option = document.createElement("option");
              option.value = time;
              option.textContent = time;
              matchTimeInput.appendChild(option);
            });
            matchTimeInput.disabled = false;
          }
        })
        .catch(err => {
          console.error("❌ Failed to load blocked times:", err);
          matchTimeInput.innerHTML = '<option value="">Error loading times</option>';
          matchTimeInput.disabled = true;
        });
    }

    if (matchDateInput && matchTimeInput && courtSelect) {
      const today = new Date().toISOString().split("T")[0];
      matchDateInput.setAttribute("min", today);

      const tryUpdateTimes = () => {
        const dateVal = matchDateInput.value;
        const courtVal = courtSelect.value;
        if (dateVal && courtVal) {
          updateAvailableTimes();
        } else {
          matchTimeInput.innerHTML = '<option value="">Select Time</option>';
          matchTimeInput.disabled = true;
        }
      };

      matchDateInput.addEventListener("change", tryUpdateTimes);
      courtSelect.addEventListener("change", tryUpdateTimes);
    }

    document.getElementById("logoutBtn")?.addEventListener("click", async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/logout", {
          method: "POST",
          credentials: "include"
        });
        if (res.ok) {
          window.location.href = "Login.html";
        } else {
          alert("Failed to logout");
        }
      } catch (err) {
        alert("Error while logging out");
      }
    });
  });
})();

// ================================
// Zoom Page & Fallback (Merged)
// ================================
window.addEventListener("DOMContentLoaded", () => {
  document.body.style.zoom = "140%";

  // Optional fallback for older browsers
  if (!("zoom" in document.body.style)) {
    document.body.style.transform = "scale(0.9)";
    document.body.style.transformOrigin = "top left";
    document.body.style.width = "111.11%";
  }
});