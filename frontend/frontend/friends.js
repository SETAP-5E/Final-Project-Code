/* Friends Page Logic */
(function friendsModule() {
  if (!window.location.href.includes('Friends.html')) return;

  document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("customModal");
    const modalMsg = document.getElementById("modalMessage");
    const closeModalBtn = document.getElementById("closeModalBtn");

    const tableBody = document.getElementById("friendsTableBody");
    const pageInfo = document.getElementById("pageInfo");
    const rowCountSelect = document.getElementById("rowCount");

    let currentPage = 1;
    let rowsPerPage = 5;
    let totalPages = 1;
    let activeFilters = {};

    const showModal = (message) => {
      if (modal && modalMsg) {
        modalMsg.textContent = message;
        modal.style.display = "flex";
      }
    };

    closeModalBtn?.addEventListener("click", () => {
      modal.style.display = "none";
    });

    const buildQueryParams = () => {
      const params = new URLSearchParams();
      params.append("page", currentPage);
      params.append("limit", rowsPerPage === Infinity ? 'all' : rowsPerPage);

      if (activeFilters.id) params.append("id", activeFilters.id);
      if (activeFilters.name) params.append("name", activeFilters.name);
      if (activeFilters.location) params.append("location", activeFilters.location);

      return params.toString();
    };

    const loadFriends = () => {
      const query = buildQueryParams();

      fetch(`http://localhost:5000/api/friends?${query}`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          const friends = data.friends || [];
          totalPages = data.pagination?.totalPages || 1;

          tableBody.innerHTML = "";

          friends.forEach(friend => {
            const row = document.createElement("tr");
            row.innerHTML = `
              <td>${friend.id}</td>
              <td>${friend.name}</td>
              <td>${friend.location}</td>
              <td>${friend.status || "Friend"}</td>
            `;
            tableBody.appendChild(row);
          });

          pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        })
        .catch(err => {
          console.error("❌ Failed to load friends:", err);
          showModal("❌ Failed to load friends.");
        });
    };

    const searchForFriends = () => {
      activeFilters.id = document.getElementById("filterId")?.value.trim();
      activeFilters.name = document.getElementById("filterName")?.value.trim().toLowerCase();
      activeFilters.location = document.getElementById("filterLocation")?.value.trim().toLowerCase();

      currentPage = 1;
      loadFriends();
    };

    const resetFilters = () => {
      document.getElementById("filterId").value = "";
      document.getElementById("filterName").value = "";
      document.getElementById("filterLocation").value = "";

      activeFilters = {};
      currentPage = 1;
      loadFriends();
    };

    const handleRowCountChange = () => {
      const val = rowCountSelect?.value || "5";
      rowsPerPage = val === "all" ? Infinity : parseInt(val, 10);
      currentPage = 1;
      loadFriends();
    };

    const prevPage = () => {
      if (currentPage > 1) {
        currentPage--;
        loadFriends();
      }
    };

    const nextPage = () => {
      if (currentPage < totalPages) {
        currentPage++;
        loadFriends();
      }
    };

    document.getElementById("searchFriendsBtn")?.addEventListener("click", searchForFriends);
    document.getElementById("resetFiltersBtn")?.addEventListener("click", resetFilters);
    rowCountSelect?.addEventListener("change", handleRowCountChange);
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

    loadFriends();
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