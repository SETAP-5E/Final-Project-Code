// ==============================
// Matchmaking Page Logic
// ==============================
(function matchmakingModule() {
  if (!window.location.href.includes('Match_making.html')) return;

  document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("customModal");
    const modalMsg = document.getElementById("modalMessage");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const tableBody = document.getElementById("playersTableBody");
    const pageInfo = document.getElementById("pageInfo");
    const rowCountSelect = document.getElementById("rowCount");

    let playersData = [];
    let currentPage = 1;
    let rowsPerPage = 5;
    let totalPages = 1;
    let showAll = false;

    const showModal = (message) => {
      if (modal && modalMsg) {
        modalMsg.textContent = message;
        modal.style.display = "flex";
      }
    };

    closeModalBtn?.addEventListener("click", () => {
      modal.style.display = "none";
    });

    async function loadPlayers() {
      try {
        const filters = new URLSearchParams({
          page: currentPage,
          limit: showAll ? 'all' : rowsPerPage
        });

        const id = document.getElementById("filterId")?.value.trim();
        const name = document.getElementById("filterName")?.value.toLowerCase().trim();
        const gender = document.getElementById("filterGender")?.value;
        const strength = document.getElementById("filterStrength")?.value;

        if (id) filters.append("id", id);
        if (name) filters.append("name", name);
        if (gender) filters.append("gender", gender);
        if (strength) filters.append("strength", strength);

        const res = await fetch(`http://localhost:5000/api/matchmaking?${filters.toString()}`);
        const data = await res.json();

        playersData = Array.isArray(data.players) ? data.players : [];
        totalPages = data.pagination?.totalPages || 1;
        updateTable();
      } catch (error) {
        console.error('❌ Failed to load players:', error);
        showModal('❌ Failed to load players.');
      }
    }

    function updateTable() {
      tableBody.innerHTML = "";
      playersData.forEach(player => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td><input type="radio" name="playerSelection" value="${player.id}"></td>
          <td>${player.id}</td>
          <td>${player.full_name}</td>
          <td>${player.strength}</td>
          <td>${player.wins}</td>
          <td>${player.losses}</td>
          <td>${player.age}</td>
          <td>${player.gender}</td>
          <td>${player.availability}</td>
        `;
        tableBody.appendChild(row);
      });
      pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    }

    function handleRowCountChange() {
      const val = rowCountSelect?.value || "5";
      showAll = (val === "all");
      rowsPerPage = showAll ? playersData.length : parseInt(val, 10);
      currentPage = 1;
      loadPlayers();
    }

    function prevPage() {
      if (!showAll && currentPage > 1) {
        currentPage--;
        loadPlayers();
      }
    }

    function nextPage() {
      if (!showAll && currentPage < totalPages) {
        currentPage++;
        loadPlayers();
      }
    }

    async function chooseSelected() {
      const selected = document.querySelector("input[name='playerSelection']:checked");
      if (!selected) return showModal("⚠️ Please select a player first.");

      try {
        const res = await fetch('http://localhost:5000/api/auth/profile', { credentials: 'include' });
        if (!res.ok) throw new Error("Not logged in");

        const row = selected.closest("tr");
        const availability = row.cells[8]?.textContent.toLowerCase();

        if (["no", "not available", "unavailable"].includes(availability)) {
          selected.checked = false;
          return showModal("❌ Player is not available.");
        }

        showModal("✅ Player Selected!");
      } catch {
        window.location.href = "Login.html";
      }
    }

    async function chooseRandom() {
      const visibleRows = Array.from(tableBody.querySelectorAll("tr"));
      if (!visibleRows.length) return showModal("⚠️ No players to choose from.");
      const randomRow = visibleRows[Math.floor(Math.random() * visibleRows.length)];
      const radio = randomRow.querySelector("input[type='radio']");
      if (radio) radio.checked = true;
      await chooseSelected();
    }

    function initMatchmakingPage() {
      document.getElementById("searchMatchesBtn")?.addEventListener("click", () => {
        currentPage = 1;
        loadPlayers();
      });
      document.getElementById("resetMatchesBtn")?.addEventListener("click", () => {
        document.getElementById("filterId").value = "";
        document.getElementById("filterName").value = "";
        document.getElementById("filterGender").value = "";
        document.getElementById("filterStrength").value = "";
        currentPage = 1;
        loadPlayers();
      });
      rowCountSelect?.addEventListener("change", handleRowCountChange);
      document.getElementById("ChooseSelectedBtn")?.addEventListener("click", chooseSelected);
      document.getElementById("ChooseRandomBtn")?.addEventListener("click", chooseRandom);
      document.getElementById("prevPageBtn")?.addEventListener("click", prevPage);
      document.getElementById("nextPageBtn")?.addEventListener("click", nextPage);
      loadPlayers();
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

    initMatchmakingPage();
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