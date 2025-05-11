(function historyMatchesModule() {
  if (!window.location.href.includes('History_matches.html')) return;

  document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("customModal");
    const modalMsg = document.getElementById("modalMessage");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const tableBody = document.getElementById("matchesTableBody");
    const pageInfo = document.getElementById("pageInfo");
    const rowCountSelect = document.getElementById("rowCount");

    let matchesData = [];
    let currentPage = 1;
    let rowsPerPage = 5;
    let totalMatches = 0;

    const showModal = (message) => {
      if (modal && modalMsg) {
        modalMsg.textContent = message;
        modal.style.display = "flex";
      }
    };

    closeModalBtn?.addEventListener("click", () => {
      modal.style.display = "none";
    });

    function getFilters() {
      return {
        date: document.getElementById("dateFilter")?.value || "",
        player: document.getElementById("playerFilter")?.value || "",
        winner: document.getElementById("winnerFilter")?.value || "",
        court: document.getElementById("CourtFilter")?.value || ""
      };
    }

    function formatDateToMMDDYYYY(dateString) {
      const date = new Date(dateString);
      if (isNaN(date)) return "-";
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      const yyyy = date.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }

    function loadMatches() {
      const filters = getFilters();
      const limitVal = rowCountSelect?.value || "5";
      rowsPerPage = limitVal === "all" ? 1000 : parseInt(limitVal, 10);

      const query = new URLSearchParams({
        page: currentPage,
        limit: limitVal,
        ...(filters.date && { date: filters.date }),
        ...(filters.player && { player: filters.player }),
        ...(filters.winner && { winner: filters.winner }),
        ...(filters.court && { court: filters.court })
      });

      fetch(`http://localhost:5000/api/history?${query.toString()}`, {
        credentials: "include"
      })
        .then((res) => res.json())
        .then((data) => {
          matchesData = Array.isArray(data.matches) ? data.matches : [];
          totalMatches = data.pagination?.total || matchesData.length;
          updateTable();
        })
        .catch((err) => {
          console.error("❌ Failed to load matches:", err);
          showModal("❌ Failed to load matches.");
        });
    }

    function updateTable() {
      tableBody.innerHTML = "";
      matchesData.forEach(match => {
        const row = document.createElement("tr");
        const formattedDate = formatDateToMMDDYYYY(match.date);
        row.innerHTML = `
          <td>${formattedDate}</td>
          <td>${match.time || "-"}</td>
          <td>${match.player1 || "-"}</td>
          <td>${match.player2 || "-"}</td>
          <td>${match.score || "N/A"}</td>
          <td>${match.winner || "Pending"}</td>
          <td>${match.court_name || "-"}</td>
          <td>${match.location || "-"}</td>
        `;
        tableBody.appendChild(row);
      });

      const totalPages = Math.ceil(totalMatches / rowsPerPage) || 1;
      pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    }

    function search() {
      currentPage = 1;
      loadMatches();
    }

    function reset() {
      document.getElementById("dateFilter").value = "";
      document.getElementById("playerFilter").value = "";
      document.getElementById("winnerFilter").value = "";
      document.getElementById("CourtFilter").value = "";
      currentPage = 1;
      loadMatches();
    }

    function prevPage() {
      if (currentPage > 1) {
        currentPage--;
        loadMatches();
      }
    }

    function nextPage() {
      const totalPages = Math.ceil(totalMatches / rowsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        loadMatches();
      }
    }

    function handleRowCountChange() {
      currentPage = 1;
      loadMatches();
    }

    document.getElementById("searchMatchesBtn")?.addEventListener("click", search);
    document.getElementById("resetMatchesBtn")?.addEventListener("click", reset);
    document.getElementById("rowCount")?.addEventListener("change", handleRowCountChange);
    document.getElementById("prevPageBtn")?.addEventListener("click", prevPage);
    document.getElementById("nextPageBtn")?.addEventListener("click", nextPage);

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

    loadMatches();
  });
})();

// ================================
// Zoom Page & Fallback (Optional)
// ================================
window.addEventListener("DOMContentLoaded", () => {
  document.body.style.zoom = "140%";

  if (!("zoom" in document.body.style)) {
    document.body.style.transform = "scale(0.9)";
    document.body.style.transformOrigin = "top left";
    document.body.style.width = "111.11%";
  }
});
