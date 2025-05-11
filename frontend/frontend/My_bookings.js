(function myBookingsModule() {
  if (!window.location.href.includes("My_Bookings.html")) return;

  document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.getElementById("bookingsTable");
    const pageInfo = document.getElementById("pageInfo");
    const rowCountSelect = document.getElementById("rowCount");
    const prevPageBtn = document.getElementById("prevPageBtn");
    const nextPageBtn = document.getElementById("nextPageBtn");

    const modal = document.getElementById("customModal");
    const modalMsg = document.getElementById("modalMessage");
    const modalActions = document.getElementById("modalActions");
    const closeModalBtn = document.getElementById("closeModalBtn");

    const editForm = document.getElementById("editBookingForm");
    const editId = document.getElementById("editBookingId");
    const editDate = document.getElementById("editDate");
    const editTime = document.getElementById("editTime");
    const editCourtSelect = document.getElementById("editCourtSelect");

    let bookings = [], requests = [], courts = [];
    let currentPage = 1, rowsPerPage = 5, totalBookings = 0;

    function resetModal() {
      modalMsg.textContent = "";
      modalActions.innerHTML = "";
      modal.style.display = "none";
      modalActions.style.display = "none";
      editForm.style.display = "none";
      closeModalBtn.style.display = "none";
    }

    function fetchCourts() {
      fetch("http://localhost:5000/api/courts", { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          courts = Array.isArray(data) ? data : data.courts || [];
          editCourtSelect.innerHTML = `<option value="">Select Location</option>`;
          courts.forEach(court => {
            const option = document.createElement("option");
            option.value = court.id;
            option.textContent = `${court.name} (${court.location})`;
            editCourtSelect.appendChild(option);
          });
        })
        .catch(err => console.error("❌ Failed to load courts:", err));
    }

    function updateAvailableEditTimes() {
      const courtId = editCourtSelect.value;
      const selectedDate = editDate.value;

      if (!courtId || !selectedDate) {
        editTime.innerHTML = '<option value="">Select Time</option>';
        editTime.disabled = true;
        return;
      }

      fetch(`http://localhost:5000/api/book/blocked?court_id=${courtId}&booking_date=${selectedDate}`, {
        credentials: 'include'
      })
        .then(res => res.json())
        .then(data => {
          const blocked = new Set(data.blocked || []);
          editTime.innerHTML = '<option value="">Select Time</option>';
          for (let h = 6; h <= 21; h++) {
            const time = `${String(h).padStart(2, '0')}:00`;
            if (!blocked.has(time)) {
              const option = document.createElement("option");
              option.value = time;
              option.textContent = time;
              editTime.appendChild(option);
            }
          }
          editTime.disabled = editTime.options.length <= 1;
        })
        .catch(err => {
          console.error("❌ Failed to load blocked times:", err);
          editTime.innerHTML = '<option value="">Error loading times</option>';
          editTime.disabled = true;
        });
    }

    function showModal(message, buttons = null) {
      modalMsg.textContent = message;
      modal.style.display = "flex";
      modalActions.innerHTML = "";
      editForm.style.display = "none";

      if (buttons) {
        modalActions.style.display = "flex";
        closeModalBtn.style.display = "none";
        buttons.forEach(btn => modalActions.appendChild(btn));
      } else {
        const okBtn = document.createElement("button");
        okBtn.textContent = "OK";
        okBtn.className = "modal-confirm";
        okBtn.onclick = resetModal;
        modalActions.appendChild(okBtn);
        modalActions.style.display = "flex";
        closeModalBtn.style.display = "none";
      }
    }

    function cancelMyBooking(id) {
      resetModal();
      const yes = document.createElement("button");
      yes.textContent = "✅ Yes";
      yes.className = "modal-confirm";
      yes.onclick = () => {
        fetch(`http://localhost:5000/api/book/${id}/cancel`, {
          method: "PUT",
          credentials: "include"
        })
          .then(() => {
            resetModal();
            fetchBookings();
          })
          .catch(err => {
            console.error("❌ Cancel failed:", err);
            showModal("❌ Cancel failed.");
          });
      };

      const no = document.createElement("button");
      no.textContent = "❌ No";
      no.className = "modal-cancel";
      no.onclick = resetModal;

      showModal(`❌ Cancel booking #${id}?`, [yes, no]);
    }

    function editMyBooking(id) {
      const b = bookings.find(b => b.id === id);
      if (!b) return;

      resetModal();
      modalMsg.textContent = "✏️ Edit Booking";
      modal.style.display = "flex";
      editForm.style.display = "block";
      modalActions.style.display = "none";
      closeModalBtn.style.display = "inline-block";

      editId.value = b.id;
      editDate.value = b.booking_date;

      const selectedCourt = courts.find(c => c.name === b.court_name && c.location === b.location);
      editCourtSelect.value = selectedCourt?.id || "";

      updateAvailableEditTimes();
      setTimeout(() => {
        editTime.value = b.booking_time;
      }, 400);
    }

    function formatDateDisplay(iso) {
      const d = new Date(iso);
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    }

    function updateTable() {
      tableBody.innerHTML = "";
      bookings.forEach(b => {
        const request = requests.find(r =>
          r.proposed_date === b.booking_date &&
          r.proposed_time === b.booking_time &&
          r.requester_id === b.user_id &&
          r.opponent_id === b.opponent_id
        );

        const opponentText = b.opponent_id
          ? request?.status === "pending"
            ? `Opponent: ${b.opponent_id}<br><button class="accept-btn" data-id="${request.id}">Accept</button><button class="reject-btn" data-id="${request.id}">Reject</button>`
            : `Opponent: ${b.opponent_id} (${request?.status || 'accepted'})`
          : 'No Opponent Assigned';

        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${formatDateDisplay(b.booking_date)}</td>
          <td>${b.booking_time}</td>
          <td>${b.court_name}</td>
          <td>${b.location}</td>
          <td>${opponentText}</td>
          <td>
            <button class="edit-button" data-id="${b.id}">Edit</button>
            <button class="cancel-button" data-id="${b.id}">Cancel</button>
          </td>
        `;
        tableBody.appendChild(row);
      });

      document.querySelectorAll(".edit-button").forEach(btn =>
        btn.addEventListener("click", () => editMyBooking(+btn.dataset.id))
      );
      document.querySelectorAll(".cancel-button").forEach(btn =>
        btn.addEventListener("click", () => cancelMyBooking(+btn.dataset.id))
      );
    }

    function fetchBookings() {
      const date = document.getElementById("filterDate").value;
      const court = document.getElementById("filterCourt").value.trim();
      const rows = rowCountSelect.value;

      const query = new URLSearchParams({
        page: currentPage,
        rows: rows === "all" ? "1000" : rows,
        ...(date && { from_date: date, to_date: date }),
        ...(court && { court_name: court })
      });

      fetch(`http://localhost:5000/api/book?${query}`, { credentials: "include" })
        .then(res => res.json())
        .then(data => {
          bookings = data.bookings || [];
          totalBookings = data.totalCount || bookings.length;
          updateTable();
        })
        .catch(err => {
          console.error("❌ Failed to load bookings:", err);
          showModal("❌ Failed to load bookings.");
        });

      fetch(`http://localhost:5000/api/match-requests`, { credentials: "include" })
        .then(res => res.json())
        .then(data => {
          requests = data.requests || [];
          updateTable();
        });
    }

    editForm.addEventListener("submit", e => {
      e.preventDefault();
      const court_id = editCourtSelect.value;
      const booking_time = editTime.value;
      const selectedCourt = courts.find(c => c.id == court_id);
      if (!booking_time || !selectedCourt) return showModal("❌ Missing required fields.");

      const data = {
        booking_date: editDate.value,
        booking_time,
        court_id,
        court_name: selectedCourt.name,
        location: selectedCourt.location
      };

      fetch(`http://localhost:5000/api/book/${editId.value}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data)
      })
        .then(res => {
          if (!res.ok) throw new Error("Update failed");
          resetModal();
          fetchBookings();
        })
        .catch(err => {
          console.error("❌ Update error:", err);
          showModal("❌ Update failed.");
        });
    });

    rowCountSelect.addEventListener("change", () => {
      rowsPerPage = rowCountSelect.value === "all" ? Infinity : parseInt(rowCountSelect.value);
      currentPage = 1;
      fetchBookings();
    });

    prevPageBtn.addEventListener("click", () => {
      if (currentPage > 1) currentPage--, fetchBookings();
    });

    nextPageBtn.addEventListener("click", () => {
      const pages = Math.ceil(totalBookings / (rowsPerPage === Infinity ? totalBookings : rowsPerPage));
      if (currentPage < pages) currentPage++, fetchBookings();
    });

    document.getElementById("searchBookingsBtn").addEventListener("click", () => {
      currentPage = 1;
      fetchBookings();
    });

    document.getElementById("resetBookingsBtn").addEventListener("click", () => {
      document.getElementById("filterDate").value = "";
      document.getElementById("filterCourt").value = "";
      currentPage = 1;
      fetchBookings();
    });

    closeModalBtn.addEventListener("click", resetModal);

    document.getElementById("logoutBtn").addEventListener("click", async () => {
      try {
        await fetch("http://localhost:5000/api/auth/logout", {
          method: "POST",
          credentials: "include"
        });
        window.location.href = "Login.html";
      } catch (err) {
        alert("Error while logging out");
      }
    });

    fetchCourts();
    fetchBookings();
    editDate.addEventListener("change", updateAvailableEditTimes);
    editCourtSelect.addEventListener("change", updateAvailableEditTimes);
  });
})();

window.addEventListener("DOMContentLoaded", () => {
  document.body.style.zoom = "140%";
  if (!("zoom" in document.body.style)) {
    document.body.style.transform = "scale(0.9)";
    document.body.style.transformOrigin = "top left";
    document.body.style.width = "111.11%";
  }
});
